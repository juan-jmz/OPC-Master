import {
  OPCUAClient,
  ClientSession
} from "node-opcua";

export async function createSession(): Promise<{
  client: OPCUAClient;
  session: ClientSession;
}> {

  const client = OPCUAClient.create({
    endpointMustExist: false
  });

  await client.connect(
    process.env.OPCUA_ENDPOINT ||
    "opc.tcp://localhost:4840/UA/SimulatedServer"
  );

  const session = await client.createSession();

  return {
    client,
    session
  };
}