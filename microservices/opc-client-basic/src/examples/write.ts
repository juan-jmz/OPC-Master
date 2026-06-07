import {
    AttributeIds,
    DataType,
    OPCUAClient,
    StatusCodes,
    Variant
} from "node-opcua";

const ENDPOINT =
    process.env.OPCUA_ENDPOINT ||
    "opc.tcp://localhost:4840/UA/SimulatedServer";

const NODE_ID = "ns=1;s=IsRunning";

async function main(): Promise<void> {

    const client = OPCUAClient.create({
        endpointMustExist: false
    });

    try {

        console.log(`Conectando a ${ENDPOINT}...\n`);

        await client.connect(ENDPOINT);

        const session = await client.createSession();

        console.log("Conectado correctamente\n");

        console.log(`Leyendo ${NODE_ID}...\n`);

        const currentValue = await session.read({
            nodeId: NODE_ID,
            attributeId: AttributeIds.Value
        });

        const currentState =
            currentValue.value.value as boolean;

        console.log(
            `Valor actual: ${currentState}`
        );

        const newState = !currentState;

        console.log(
            `Nuevo valor: ${newState}\n`
        );

        const statusCode = await session.write({
            nodeId: NODE_ID,
            attributeId: AttributeIds.Value,
            value: {
                value: new Variant({
                    dataType: DataType.Boolean,
                    value: newState
                })
            }
        });

        if (statusCode !== StatusCodes.Good) {

            console.error(
                `Error escribiendo: ${statusCode.toString()}`
            );

            return;
        }

        console.log(
            `Escritura exitosa (${statusCode.toString()})\n`
        );

        const verification = await session.read({
            nodeId: NODE_ID,
            attributeId: AttributeIds.Value
        });

        console.log(
            `Valor después de escribir: ${verification.value.value}`
        );

        await session.close();
        await client.disconnect();

        console.log("\nDesconectado");

    } catch (error) {

        console.error(
            "Error durante la escritura:",
            error
        );

        await client.disconnect();
    }
}

main();