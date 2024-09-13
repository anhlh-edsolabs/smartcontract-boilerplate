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
        const { artifactName, deploymentName } =
            Utils.getContractName(contractItem);

        const contractAlias =
            deploymentName != "" ? deploymentName : artifactName;

        if (ABIs.hasOwnProperty(contractAlias)) {
            let abi = ABIs[contractAlias];
            let contract = new ethers.Contract(Addresses[contractAlias], abi);
            Contracts[contractAlias] = contract;

            const funcList = abi.filter((field) => field.type == "function");

            const eventList = abi.filter((field) => field.type == "event");

            const errorList = abi.filter((field) => field.type == "error");

            ContractSigHashes[contractAlias] = [];
            for (const func of funcList) {
                // get the input types of the function
                const funcInputTypes = Utils.iterateInputs(func.inputs);

                const funcSignature = `${func.name}(${funcInputTypes})`;

                const funcSigHash = {
                    name: funcSignature,
                    sigHash: contract.interface.getFunction(
                        func.name,
                        func.inputs,
                    ).selector,
                };
                ContractSigHashes[contractAlias].push(funcSigHash);
            }

            for (const event of eventList) {
                // get the input types of the event
                const eventInputTypes = Utils.iterateInputs(event.inputs);

                const eventSignature = `${event.name}(${eventInputTypes})`;

                const eventSigHash = {
                    name: eventSignature,
                    eventTopic: contract.interface.getEvent(
                        event.name,
                        event.inputs,
                    ).topicHash,
                };
                ContractSigHashes[contractAlias].push(eventSigHash);
            }

            for (const error of errorList) {
                // get the input types of the error
                const errorInputTypes = Utils.iterateInputs(error.inputs);

                const errorSignature = `${error.name}(${errorInputTypes})`;

                const errorSigHash = {
                    name: errorSignature,
                    errorSigHash: contract.interface.getError(
                        error.name,
                        error.inputs,
                    ).selector,
                };
                ContractSigHashes[contractAlias].push(errorSigHash);
            }
        }
    }

    log(ContractSigHashes);
})();
