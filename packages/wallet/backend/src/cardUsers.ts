import { createContainer } from '@/createContainer'
import { env } from './config/env'
import { GateHubClient } from './gatehub/client';




async function cardManagement(){

     const container = await createContainer(env);
     const ghClient= await container.resolve<GateHubClient>('gatehubService');

    // import list of emails from a file
    const users = [{
        email: 'email1@test.com', walletAddress: 'walletAddress1', 
    }, {email: 'email2@test.com', walletAddress: 'walletAddress2',}];


    // for each email, create managed account in gatehub 
    await Promise.all(users.map(({email})=>ghClient.createManagedUser(email).then(res=>({userId: res.id, gwConnected: ghClient.connectUserToGateway(res.id,env.GATEHUB_GATEWAY_UUID)})).then().catch((e=> console.error(e)))))
   






}


cardManagement().then(()=>{
    console.log('cardManagement function executed successfully');
})
