export const getVerifyEmailTemplate = (url: string): string => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    <html lang="en">
      <head></head>
      <body style="background-color:rgb(121, 200, 188);margin:0 auto;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif">
        <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto">
          <tr style="width:100%">
            <td>
              <table style="margin-top:32px;text-align:center;" align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%">
                <tbody>
                  <tr>
                    <td><a href="https://rafiki.money" target="_blank"><img alt="Interledger Testnet" src="https://raw.githubusercontent.com/interledger/testnet/60ca629046f50e3ed47406fa2cb20c6abd34be2f/packages/wallet/backend/src/emailTemplates/images/InterledgerTestnet.png" width="160" height="57" style="outline:none;border:none;text-decoration:none" /></a></td>
                  </tr>
                </tbody>
              </table>
             
              <table style="background:#ffffff;margin:30px 50px 30px 0;padding:23px;text-align:center; border:solid 10px rgb(121, 200, 188);" align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%">
                <tbody>
                <tr>
                    <td>
                      <img alt="Verify Email" src="https://raw.githubusercontent.com/interledger/testnet/136572c9cd3b821392d89e4678d64d492e283265/packages/wallet/backend/src/email/templates/images/Verify.png" width="120" height="140" style="outline:none;border:none;text-decoration:none" />
                    </td>
                </tr>
                <tr>
                    <td>
                      <h1 style="color:#4CBDBB;font-size:36px;font-weight:500;margin:30px 0;padding:0;line-height:42px">Verify your account</h1>
                    </td>
               </tr>
                  <tr>
                    <td>
                      <p style="font-size:16px;line-height:28px;margin:16px 0;margin-bottom:30px">Welcome to Interledger Testnet. Before we get started, click on the link bellow to verify your email address.</p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${url}" target="_blank">
                        <span style="background-color:#4CBDBB;border-radius:4px;color:#fff;font-size:15px;text-decoration:none;text-align:center;display:inline-block;width:210px;padding:10px 3px;max-width:100%;line-height:120%;text-transform:none;">Confirm my email address</span>
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="font-size:12px;line-height:24px;margin:16px 0 2px 0;color:#000">If you didn&#x27;t request this email, there&#x27;s nothing to worry about, you can safely ignore it.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
  
              <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%">
                <tbody>
                  <tr>
                    <td>
                      <table width="100%" style="margin-bottom:32px;padding-left:8px;padding-right:8px;width:100%" align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0">
                        <tbody style="width:100%">
                          <tr style="width:100%">
                            <td style="width:100%;text-align:center;">
                              <a href="https://interledger.org" target="_blank">
                                <img alt="Interledger Foundation" src="https://raw.githubusercontent.com/interledger/testnet/60ca629046f50e3ed47406fa2cb20c6abd34be2f/packages/wallet/backend/src/emailTemplates/images/InterledgerFoundation.png" width="202" height="56" style="outline:none;border:none;text-decoration:none;"/>
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`
}
