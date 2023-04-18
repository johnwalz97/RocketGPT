import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { RocketGptApp } from "../RocketGptApp";

export class RocketGPTCommand implements ISlashCommand {
    public command = "rocketgpt";
    public i18nParamsExample = "Say anything...";
    public i18nDescription = "Talk to RocketGPT";
    public providesPreview = false;

    constructor(private readonly app: RocketGptApp) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const creator: IModifyCreator = modify.getCreator();
        const sender: IUser = (await read.getUserReader().getAppUser()) as IUser;
        const room: IRoom = context.getRoom();
        const args = context.getArguments().join(" ");

        if (!args) {
            const messageTemplate: IMessage = {
                text: "Please provide a message to send to ChatGPT.",
                sender,
                room
            };
            const messageBuilder: IMessageBuilder = creator.startMessage(messageTemplate);
            await creator.finish(messageBuilder)
            return;
        }

        const apiKey = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("chatgpt_api_key");
        const url = "https://api.openai.com/v1/chat/completions";

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        };

        const payload = {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: args }],
            temperature: 0.8,
        };

        try {
            const response = await http.post(url, { headers, data: payload });

            if (response.statusCode !== 200) {
                const messageTemplate: IMessage = {
                    text: "Error processing the request. Please try again later. Status code: " + response.statusCode,
                    sender,
                    room
                };
                const messageBuilder: IMessageBuilder = creator.startMessage(messageTemplate);
                await creator.finish(messageBuilder)
                return;
            }

            const responseData = JSON.parse(response.content || "{}");
            const message = responseData.choices[0].message.content.trim();

            const messageTemplate: IMessage = { text: message, sender, room };
            const messageBuilder: IMessageBuilder = creator.startMessage(messageTemplate);
            await creator.finish(messageBuilder)
        } catch (error) {
            this.app.getLogger().error("Error calling ChatGPT:", error);

            const messageTemplate: IMessage = {
                text: "Error processing the request. Please try again later." + error,
                sender,
                room
            };
            const messageBuilder: IMessageBuilder = creator.startMessage(messageTemplate);
            await creator.finish(messageBuilder)
        }
    }
}
