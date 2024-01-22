import { UseCase } from "../../CompositionRoot";
import { FutureData, Future } from "../entities/Future";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export class SaveUserStatusUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(users: User[], disabled: boolean): FutureData<void> {
        const usersToUpdate = users.map(user => {
            return { ...user, disabled: disabled };
        });
        return this.userRepository.save(usersToUpdate).flatMap(() => {
            return Future.success(undefined);
        });
    }
}
