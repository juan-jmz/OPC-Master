import {
    AttributeIds,
    OPCUAClient,
    makeAccessLevelFlag
} from "node-opcua";

const ENDPOINT =
    process.env.OPCUA_ENDPOINT ||
    "opc.tcp://localhost:4840/UA/SimulatedServer";

const NODES = [
    "ns=1;s=Temperature",
    "ns=1;s=Pressure",
    "ns=1;s=IsRunning",
    "ns=1;s=Counter",
    "ns=1;s=Status",
    "ns=1;s=LastUpdate"
];

function decodeAccessLevel(accessLevel: number): string {

    const canRead =
        (accessLevel & 0x01) !== 0;

    const canWrite =
        (accessLevel & 0x02) !== 0;

    if (canRead && canWrite) {
        return "Read / Write";
    }

    if (canRead) {
        return "Read Only";
    }

    if (canWrite) {
        return "Write Only";
    }

    return "No Access";
}

async function main(): Promise<void> {

    const client = OPCUAClient.create({
        endpointMustExist: false
    });

    try {

        console.log(`Conectando a ${ENDPOINT}...\n`);

        await client.connect(ENDPOINT);

        const session = await client.createSession();

        console.log("Conectado correctamente\n");

        for (const nodeId of NODES) {

            const browseNameResult =
                await session.read({
                    nodeId,
                    attributeId: AttributeIds.BrowseName
                });

            const accessLevelResult =
                await session.read({
                    nodeId,
                    attributeId: AttributeIds.AccessLevel
                });

            const userAccessLevelResult =
                await session.read({
                    nodeId,
                    attributeId: AttributeIds.UserAccessLevel
                });

            const browseName =
                browseNameResult.value.value?.name ??
                "Unknown";

            const accessLevel =
                accessLevelResult.value.value ?? 0;

            const userAccessLevel =
                userAccessLevelResult.value.value ?? 0;

            console.log(`${browseName}`);
            console.log(`  NodeId: ${nodeId}`);
            console.log(`  AccessLevel: ${accessLevel}`);
            console.log(
                `  AccessLevel Text: ${decodeAccessLevel(accessLevel)}`
            );
            console.log(`  UserAccessLevel: ${userAccessLevel}`);
            console.log(
                `  UserAccessLevel Text: ${decodeAccessLevel(userAccessLevel)}`
            );
            console.log();
        }

        await session.close();
        await client.disconnect();

        console.log("Desconectado");

    } catch (error) {

        console.error(
            "Error obteniendo Access Levels:",
            error
        );

        await client.disconnect();
    }
}

main();