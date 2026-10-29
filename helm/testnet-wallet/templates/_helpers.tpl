{{/*
testnet-wallet.otelCollectorName is the collector's Deployment and ConfigMap
name.
*/}}
{{- define "testnet-wallet.otelCollectorName" -}}
{{- printf "%s-%s" (include "common.fullname" .) .Values.otelCollector.name -}}
{{- end -}}

{{/*
testnet-wallet.otelCollectorServiceName is the collector Service's name, the
host the backend and the frontend dial. common.svc names it after
otelCollector.service.name, which need not match otelCollector.name.
*/}}
{{- define "testnet-wallet.otelCollectorServiceName" -}}
{{- printf "%s-%s" (include "common.fullname" .) .Values.otelCollector.service.name -}}
{{- end -}}

{{/*
testnet-wallet.otelCollectorContainerPort is the collector container port with
the given name. The collector config listens on these ports, so the container
ports are the one place to move a listener. Fails the render if the port is
missing.

Usage: include "testnet-wallet.otelCollectorContainerPort" (list . "otlp-grpc")
*/}}
{{- define "testnet-wallet.otelCollectorContainerPort" -}}
{{- $top := index . 0 -}}
{{- $name := index . 1 -}}
{{- $port := 0 -}}
{{- range $top.Values.otelCollector.ports -}}
{{- if eq .name $name -}}
{{- $port = .containerPort -}}
{{- end -}}
{{- end -}}
{{- if eq (int $port) 0 -}}
{{- fail (printf "otelCollector.ports must contain a port named %s — the collector config listens on it" $name) -}}
{{- end -}}
{{- $port -}}
{{- end -}}

{{/*
testnet-wallet.otelCollectorOTLPPort is the collector Service's OTLP/gRPC port,
read off the port named `otlp-grpc`, so that moving it moves the endpoint the
backend and the frontend dial.
*/}}
{{- define "testnet-wallet.otelCollectorOTLPPort" -}}
{{- $port := 0 -}}
{{- range .Values.otelCollector.service.ports -}}
{{- if eq .name "otlp-grpc" -}}
{{- $port = .port -}}
{{- end -}}
{{- end -}}
{{- if eq (int $port) 0 -}}
{{- fail "otelCollector.service.ports must contain a port named otlp-grpc — the backend and the frontend dial the collector on it" -}}
{{- end -}}
{{- $port -}}
{{- end -}}

{{/*
testnet-wallet.telemetryEndpoint is the OTLP/gRPC target both components send
to: config.telemetry.endpoint when set, otherwise this release's collector.
*/}}
{{- define "testnet-wallet.telemetryEndpoint" -}}
{{- $telemetry := .Values.config.telemetry -}}
{{- if $telemetry.endpoint -}}
{{- $telemetry.endpoint -}}
{{- else -}}
{{- if not .Values.otelCollector.enabled -}}
{{- fail "config.telemetry.enabled is true, but otelCollector.enabled is false and no config.telemetry.endpoint is set — enable the collector, or point the endpoint at one outside this release" -}}
{{- end -}}
{{- printf "%s:%v" (include "testnet-wallet.otelCollectorServiceName" .) (include "testnet-wallet.otelCollectorOTLPPort" .) -}}
{{- end -}}
{{- end -}}

{{/*
testnet-wallet.telemetryData renders the TELEMETRY_* and SERVICE_* ConfigMap
keys for one component, "backend" or "frontend". Both read the same
config.telemetry block, so the two halves of the wallet are always on or off
together and send to the same collector. With telemetry off it renders
nothing, and the applications keep their own default, which is off.

SERVICE_VERSION is the component's image tag, resolved the way the common
chart resolves it, so a trace can be read against the build that produced it.
*/}}
{{- define "testnet-wallet.telemetryData" -}}
{{- $top := index . 0 -}}
{{- $component := index . 1 -}}
{{- $telemetry := $top.Values.config.telemetry -}}
{{- if $telemetry.enabled -}}
{{- $deployment := index $top.Values.deployments $component -}}
{{- $image := $deployment.image | default dict -}}
{{- $imageOverride := $top.Values.imageOverride | default dict -}}
{{- $version := coalesce $telemetry.serviceVersion $image.tag $top.Values.versionOverride $imageOverride.tag $top.Chart.AppVersion -}}
TELEMETRY_ENABLED: "true"
TELEMETRY_ENDPOINT: {{ include "testnet-wallet.telemetryEndpoint" $top | quote }}
TELEMETRY_INSECURE: {{ $telemetry.insecure | toString | quote }}
TELEMETRY_TRACES_ENABLED: {{ $telemetry.traces.enabled | toString | quote }}
TELEMETRY_TRACES_SAMPLE_RATIO: {{ $telemetry.traces.sampleRatio | toString | quote }}
TELEMETRY_METRICS_ENABLED: {{ $telemetry.metrics.enabled | toString | quote }}
TELEMETRY_METRICS_INTERVAL: {{ $telemetry.metrics.interval | quote }}
SERVICE_NAME: {{ index $telemetry.serviceNames $component | quote }}
SERVICE_VERSION: {{ $version | quote }}
SERVICE_ENV: {{ $telemetry.serviceEnv | quote }}
{{- end -}}
{{- end -}}

{{/*
testnet-wallet.otelCollectorConfig renders the collector's own config file. Set
otelCollector.config to replace it wholesale. The generated pipeline is the one
the merchant and issuer charts use:

  OTLP in (gRPC and HTTP)
    -> metrics out on the Prometheus exporter, which Prometheus scrapes
       through the ServiceMonitor
    -> traces out over OTLP to otelCollector.traces.endpoint

Three details it does not show on its face:

  * With no traces endpoint the pipeline exports to `nop`. A pipeline must
    have an exporter, and dropping the pipeline would unregister the OTLP
    trace service, so the wallet would log a failed export on every batch.

  * memory_limiter runs first, shedding load before the batcher can queue
    enough to push the heap past the container memory limit. Its percentages
    are of that limit, so raise the limit before raising them.

  * resource_to_telemetry_conversion turns resource attributes into labels:
    service_name, service_version, service_instance_id,
    deployment_environment_name. One collector serves the backend and the
    frontend, and every replica of each, so without service_instance_id
    replicas emit identical label sets and overwrite each other's samples.
*/}}
{{- define "testnet-wallet.otelCollectorConfig" -}}
{{- if .Values.otelCollector.config -}}
{{- toYaml .Values.otelCollector.config -}}
{{- else -}}
{{- $c := .Values.otelCollector -}}
extensions:
  health_check:
    endpoint: 0.0.0.0:{{ include "testnet-wallet.otelCollectorContainerPort" (list . "health") }}

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:{{ include "testnet-wallet.otelCollectorContainerPort" (list . "otlp-grpc") }}
      http:
        endpoint: 0.0.0.0:{{ include "testnet-wallet.otelCollectorContainerPort" (list . "otlp-http") }}

processors:
  memory_limiter:
    check_interval: 1s
    limit_percentage: {{ $c.memoryLimiter.limitPercentage }}
    spike_limit_percentage: {{ $c.memoryLimiter.spikeLimitPercentage }}
  batch:
    timeout: {{ $c.batch.timeout }}
    send_batch_size: {{ $c.batch.sendBatchSize }}

exporters:
  prometheus:
    endpoint: 0.0.0.0:{{ include "testnet-wallet.otelCollectorContainerPort" (list . "metrics") }}
    resource_to_telemetry_conversion:
      enabled: true
    metric_expiration: {{ $c.metricExpiration }}
{{- if $c.traces.endpoint }}
  otlp/traces:
    endpoint: {{ $c.traces.endpoint | quote }}
    tls:
      insecure: {{ $c.traces.insecure }}
{{- else }}
  nop: {}
{{- end }}

service:
  extensions: [health_check]
  telemetry:
    metrics:
      readers:
        - pull:
            exporter:
              prometheus:
                host: 0.0.0.0
                port: {{ include "testnet-wallet.otelCollectorContainerPort" (list . "telemetry") }}
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [{{ if $c.traces.endpoint }}otlp/traces{{ else }}nop{{ end }}]
{{- end -}}
{{- end -}}
