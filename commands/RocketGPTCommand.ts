import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { RocketGptApp } from "../RocketGptApp";

export class RocketGPTCommand implements ISlashCommand {
    public command = "rocketgpt";
    public i18nParamsExample = "RocketGPTCommand_Params";
    public i18nDescription = "RocketGPTCommand_Description";
    public providesPreview = false;

    constructor(private readonly app: RocketGptApp) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const sender = context.getSender();
        const room = context.getRoom();
        const args = context.getArguments().join(" ");

        if (!args) {
            await modify
                .getNotifier()
                .notifyUser(
                    sender,
                    modify
                        .getCreator()
                        .startMessage()
                        .setText("Please provide a message to send to ChatGPT.")
                        .getMessage()
                );
            return;
        }

        const apiKey = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("chatgpt_api_key");
        const url =
            "https://api.openai.com/v1/engines/davinci-codex/completions";

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        };

        const payload = {
            prompt: args,
            max_tokens: 50,
            n: 1,
            stop: null,
            temperature: 0.8,
        };

        try {
            const response = await http.post(url, { headers, data: payload });
            const responseData = JSON.parse(response.content || "{}");
            const message = responseData.choices[0].text.trim();

            await modify
                .getCreator()
                .startMessage()
                .setSender(sender)
                .setRoom(room)
                .setText(message)
                .getMessage();
        } catch (error) {
            this.app.getLogger().error("Error calling ChatGPT:", error);
            await modify
                .getNotifier()
                .notifyUser(
                    sender,
                    modify
                        .getCreator()
                        .startMessage()
                        .setText(
                            "Error processing the request. Please try again later."
                        )
                        .getMessage()
                );
        }
    }
}
