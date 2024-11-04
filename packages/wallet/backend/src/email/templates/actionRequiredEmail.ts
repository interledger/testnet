export const getActionRequiredEmailTemplate = (
  textHtml: string,
  imageSrc: string
): string => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    <html lang="en">
      <head></head>
      <body style="background-color:#eefee5;margin:0 auto;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif">
        <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto">
          <tr style="width:100%">
            <td>
              <table style="margin-top:32px;text-align:center;" align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%">
                <tbody>
                  <tr>
                    <td><a href="https://wallet.interledger-test.dev" target="_blank"><img alt="Interledger Wallet" src="${imageSrc}" width="250" style="outline:none;border:none;text-decoration:none" /></a></td>
                  </tr>
                </tbody>
              </table>
             
              <table style="background:#ffffff;margin:30px 50px 30px 0;padding:23px;text-align:center; border:solid 10px #0e7b31;" align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%">
                <tbody>
                  <tr>
                    <td>
                      <h1 style="color:#0e7b31;font-size:36px;font-weight:500;margin:30px 0;padding:0;line-height:42px">Action Required</h1>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      ${textHtml}
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
                                <img alt="Interledger Foundation" src="https://raw.githubusercontent.com/interledger/testnet/main/packages/wallet/backend/src/email/templates/images/InterledgerFoundation.png" width="202" height="56" style="outline:none;border:none;text-decoration:none;"/>
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
