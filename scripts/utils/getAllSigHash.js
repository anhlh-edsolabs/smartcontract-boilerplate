const ethers = require("ethers");
const {
    log,
    ABIs,
    Addresses,
    DeploymentStorage,
    Constants,
    Utils,
} = require(".");

const deployment = DeploymentStorage.Env[Constants.ENV_KEY];

(async () => {
    const ContractSigHashes = [];
    const Contracts = {};
    // let _artifacts = await Artifacts.getArtifacts();

    for (let contractItem in deployment) {
        if (ABIs.hasOwnProperty(contractItem)) {
            let abi = ABIs[contractItem];
            let contract = new zksync.Contract(Addresses[contractItem], abi);
            Contracts[contractItem] = contract;

            const funcList = abi.filter(
                (field) => field.type == "function" || field.type == "error"
            );

            const eventList = abi.filter((field) => field.type == "event");

            ContractSigHashes[contractItem] = [];
            for (const func of funcList) {
                // get the input types of the function
                const funcInputTypes = Utils.iterateInputs(func.inputs);
                    
                const funcSignature = `${func.name}(${funcInputTypes})`;

                const funcSigHash = {
                    name: funcSignature,
                    sigHash: contract.interface.getSighash(funcSignature),
                };
                ContractSigHashes[contractItem].push(funcSigHash);
            }

            for (const event of eventList) {
                // get the input types of the event
                const eventInputTypes = Utils.iterateInputs(event.inputs);

                const eventSignature = `${event.name}(${eventInputTypes})`;

                const eventSigHash = {
                    name: eventSignature,
                    eventTopic: contract.interface.getEventTopic(contract.interface.getEvent(eventSignature)),
                };
                ContractSigHashes[contractItem].push(eventSigHash);
            }   
        }
    }

    log(ContractSigHashes);
})();
