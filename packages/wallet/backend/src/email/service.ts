import {Env} from "@/config/env";
import * as sendgrid from "@sendgrid/mail";

interface IEmailData {
    to: string;
    from: string;
    subject: string;
    html: string;
}

interface IEmailService {
    send(args: AuthorizeArgs): Promise<AuthorizeResult>
}
interface EmailServiceDependencies {
    env: Env
}

export class EmailService implements IEmailService {
    constructor(private deps: AuthServiceDependencies) {
        sendgrid.setApiKey(this.deps.env.SENDGRID_API_KEY)
    }

    send(email: IEmailData): Promise<void> {
        return sendgrid.send(email)
    }
}
