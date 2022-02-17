import { Instance } from "./data/entities/Instance";
import { InstanceD2ApiRepository } from "./data/repositories/InstanceD2ApiRepository";
import { MetadataD2ApiRepository } from "./data/repositories/MetadataD2ApiRepository";
import { UserD2ApiRepository } from "./data/repositories/UserD2ApiRepository";
import { GetCurrentUserUseCase } from "./domain/usecases/GetCurrentUserUseCase";
import { GetInstanceLocalesUseCase } from "./domain/usecases/GetInstanceLocalesUseCase";
import { GetInstanceVersionUseCase } from "./domain/usecases/GetInstanceVersionUseCase";
import { GetUserByIdUseCase } from "./domain/usecases/GetUserByIdUseCase";
import { ListAllUserIdsUseCase } from "./domain/usecases/ListAllUserIdsUseCase";
import { ListMetadataUseCase } from "./domain/usecases/ListMetadataUseCase";
import { ListUsersUseCase } from "./domain/usecases/ListUsersUseCase";
import { SaveUsersUseCase } from "./domain/usecases/SaveUsersUseCase";

export function getCompositionRoot(instance: Instance) {
    const instanceRepository = new InstanceD2ApiRepository(instance);
    const userRepository = new UserD2ApiRepository(instance);
    const metadataRepository = new MetadataD2ApiRepository(instance);

    return {
        instance: getExecute({
            getVersion: new GetInstanceVersionUseCase(instanceRepository),
            getLocales: new GetInstanceLocalesUseCase(instanceRepository),
        }),
        users: getExecute({
            getCurrent: new GetCurrentUserUseCase(userRepository),
            list: new ListUsersUseCase(userRepository),
            listAllIds: new ListAllUserIdsUseCase(userRepository),
            get: new GetUserByIdUseCase(userRepository),
            save: new SaveUsersUseCase(userRepository),
        }),
        metadata: getExecute({
            list: new ListMetadataUseCase(metadataRepository),
        }),
    };
}

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

function getExecute<UseCases extends Record<Key, UseCase>, Key extends keyof UseCases>(
    useCases: UseCases
): { [K in Key]: UseCases[K]["execute"] } {
    const keys = Object.keys(useCases) as Key[];
    const initialOutput = {} as { [K in Key]: UseCases[K]["execute"] };

    return keys.reduce((output, key) => {
        const useCase = useCases[key];
        const execute = useCase.execute.bind(useCase) as UseCases[typeof key]["execute"];
        output[key] = execute;
        return output;
    }, initialOutput);
}

export interface UseCase {
    execute: Function;
}
