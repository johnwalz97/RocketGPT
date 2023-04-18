import {
    IAppAccessors,
    IConfigurationExtend,
    ILogger,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { SettingType } from "@rocket.chat/apps-engine/definition/settings";
import { RocketGPTCommand } from "./commands/RocketGPTCommand";

export class RocketGptApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(
        config: IConfigurationExtend
    ): Promise<void> {
        await config.settings.provideSetting({
            id: "chatgpt_api_key",
            type: SettingType.STRING,
            packageValue: "",
            required: true,
            public: false,
            i18nLabel: "API Key",
            i18nDescription: "API Key for ChatGPT",
        });

        await config.slashCommands.provideSlashCommand(new RocketGPTCommand(this));
    }
}
