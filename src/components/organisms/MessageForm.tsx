import { type ChangeEvent, Component, createRef } from "react";
import Button from "../atoms/Button";
import { ControlTextArea } from "../atoms/ControlFactory";
import Box from "../molecules/Box";
import SelectCountryCode from "../molecules/SelectCountryCode";
import type { Attachment } from "types/Attachment";
import type { Message } from "types/Message";

export default class MessageForm extends Component<
  { className?: string },
  {
    message: string;
    attachment?: Attachment | null;
    delay: number;
    randomDelay: boolean;
    batchSize: number;
    batchSleep: number;
  }
> {
  constructor(props: { className?: string }) {
    super(props);
    this.defaultMessage = chrome.i18n.getMessage("defaultMessage");
    this.state = {
      message: this.defaultMessage,
      attachment: undefined,
      delay: 0,
      randomDelay: false,
      batchSize: 0,
      batchSleep: 0,
    };
  }

  fileRef = createRef<HTMLInputElement>();
  defaultMessage: string;
  titleMessageForm = chrome.i18n.getMessage("titleMessageForm");
  attachmentLabelMessageForm = chrome.i18n.getMessage(
    "attachmentLabelMessageForm",
  );
  cleanButtonLabel = chrome.i18n.getMessage("cleanButtonLabel");
  footerLabelMessageForm = chrome.i18n.getMessage("footerLabelMessageForm");
  footerSuggestionMessageForm = chrome.i18n.getMessage(
    "footerSuggestionMessageForm",
  );
  delayLabelMessageForm = chrome.i18n.getMessage("delayLabelMessageForm");
  countryCodePrefixMessageForm = chrome.i18n.getMessage(
    "countryCodePrefixMessageForm",
  );

  override componentDidMount() {
    chrome.storage.local.get(
      ({
        message = this.defaultMessage,
        attachment,
        delay = 0,
        randomDelay = false,
        batchSize = 0,
        batchSleep = 0,
      }: Omit<Message, "contact"> & {
        randomDelay?: boolean;
        batchSize?: number;
        batchSleep?: number;
      }) => {
        this.setState({
          message,
          attachment,
          delay,
          randomDelay,
          batchSize,
          batchSleep,
        });
        if (attachment?.url && this.fileRef.current) {
          void fetch(attachment.url)
            .then((response) => response.blob())
            .then((blob) => {
              const myFile = new File([blob], attachment.name, {
                  type: attachment.type,
                  lastModified: attachment.lastModified,
                }),
                dataTransfer = new DataTransfer();
              dataTransfer.items.add(myFile);
              if (this.fileRef.current)
                this.fileRef.current.files = dataTransfer.files;
            });
        } else {
          console.log("No attachment to set");
        }
      },
    );
  }

  override componentDidUpdate(
    _prevProps: Readonly<{ className?: string }>,
    prevState: Readonly<{
      message: string;
      attachment?: Attachment | null;
      delay: number;
      randomDelay: boolean;
      batchSize: number;
      batchSleep: number;
    }>,
  ) {
    const { message, attachment, delay, randomDelay, batchSize, batchSleep } =
      this.state;

    if (prevState.message !== message)
      void chrome.storage.local.set({ message });

    if (prevState.delay !== delay) void chrome.storage.local.set({ delay });

    if (prevState.randomDelay !== randomDelay)
      void chrome.storage.local.set({ randomDelay });

    if (prevState.batchSize !== batchSize)
      void chrome.storage.local.set({ batchSize });

    if (prevState.batchSleep !== batchSleep)
      void chrome.storage.local.set({ batchSleep });

    if (prevState.attachment?.url !== attachment?.url)
      void chrome.storage.local.set({ attachment });
  }

  handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ message: event.target.value });
  };

  handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files.item(0);
      if (!file) {
        console.error("No file selected");
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!ev.target?.result) {
          console.error("No file content");
          return;
        }
        const decoder = new TextDecoder("utf-8"); // Assuming UTF-8 encoding

        this.setState({
          attachment: {
            name: file.name,
            type: file.type,
            url:
              typeof ev.target.result === "string"
                ? ev.target.result
                : decoder.decode(ev.target.result),
            lastModified: file.lastModified,
          },
        });
      };
      reader.readAsDataURL(file);
    } else {
      this.setState({ attachment: undefined });
    }
  };

  handleFileClear = () => {
    if (!this.fileRef.current) return;
    this.fileRef.current.files = new DataTransfer().files;
    this.setState({ attachment: undefined });
  };

  override render() {
    const { message, attachment } = this.state;

    return (
      <Box
        className={this.props.className}
        title={this.titleMessageForm}
        footer={
          <>
            <p className="mb-1">{this.footerLabelMessageForm}</p>
            <p>{this.footerSuggestionMessageForm}</p>
          </>
        }
      >
        <div className="mt-4 mx-4 flex flex-row gap-4">
          <div className="flex flex-col basis-1/2">
            <ControlTextArea
              value={message}
              onChange={this.handleMessageChange}
            />
          </div>
          <div
            className={[
              "px-4",
              "py-6",
              "flex",
              "flex-col",
              "flex-auto",
              "basis-1/2",
              "border-2",
              "border-dashed",
              "border-slate-400",
              "dark:border-slate-600",
              "rounded-lg",
            ].join(" ")}
          >
            <label
              htmlFor="attachment"
              className="mb-2 w-full text-center flex flex-col items-center justify-center min-h-[8rem] cursor-pointer"
            >
              {attachment?.name ? (
                attachment.type.startsWith("image/") ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={attachment.url}
                      alt="preview"
                      className="max-h-32 object-contain rounded-lg shadow-md"
                    />
                    <span className="text-xs text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[12rem]">
                      {attachment.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-4xl">📎</p>
                    <span className="text-sm font-medium">
                      {attachment.name}
                    </span>
                  </div>
                )
              ) : (
                <>
                  <p className="mb-2 text-3xl">🖼</p>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {this.attachmentLabelMessageForm}
                  </p>
                </>
              )}
            </label>
            <input
              id="attachment"
              name="attachment"
              className="hidden"
              type="file"
              ref={this.fileRef}
              onChange={this.handleFileChange}
            />
            {Boolean(attachment) && (
              <Button variant="danger" onClick={this.handleFileClear}>
                {this.cleanButtonLabel}
              </Button>
            )}
          </div>
        </div>
        <div className="mx-4 mb-4 flex flex-col">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="randomDelay"
              checked={this.state.randomDelay}
              onChange={(e) => {
                this.setState({ randomDelay: e.target.checked });
              }}
              className="mr-2 cursor-pointer w-4 h-4 accent-slate-600 dark:accent-slate-400"
            />
            <label htmlFor="randomDelay" className="cursor-pointer select-none">
              Random Delay (6s - 15s)
            </label>
          </div>
          {!this.state.randomDelay && (
            <div className="flex items-center w-full">
              <label htmlFor="delay" className="whitespace-nowrap mr-2">
                {this.delayLabelMessageForm} (
                <span className="font-mono">
                  {this.state.delay.toFixed(1)}s
                </span>
                ):
              </label>
              <input
                type="range"
                id="delay"
                name="delay"
                min="0"
                max="10"
                step="0.1"
                value={this.state.delay}
                onChange={(e) => {
                  this.setState({ delay: Number(e.target.value) });
                }}
                className={[
                  "w-full",
                  "h-1.5",
                  "bg-slate-100",
                  "dark:bg-slate-900",
                  "border",
                  "border-slate-400",
                  "dark:border-slate-600",
                  "accent-slate-600",
                  "dark:accent-slate-400",
                  "appearance-none",
                  "outline-none",
                  "rounded-full",
                  "cursor-pointer",
                  "transition-shadow",
                  "ease-in-out",
                  "duration-150",
                  "hover:bg-blue-100",
                  "dark:hover:bg-blue-900",
                  "focus:shadow-equal",
                  "focus:shadow-blue-800",
                  "dark:focus:shadow-blue-200",
                  "focus:outline-none",
                ].join(" ")}
              />
            </div>
          )}
        </div>

        <div className="mx-4 mb-4 flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5">
          <p className="font-semibold text-sm mb-3">Anti-Ban Batching</p>
          <div className="flex gap-4">
            <div className="flex flex-col flex-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Pause after X msgs
              </label>
              <input
                type="number"
                min="0"
                value={this.state.batchSize}
                onChange={(e) => {
                  this.setState({ batchSize: Number(e.target.value) });
                }}
                className="w-full text-sm p-2 bg-white dark:bg-black rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Sleep for (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={this.state.batchSleep}
                onChange={(e) => {
                  this.setState({ batchSleep: Number(e.target.value) });
                }}
                className="w-full text-sm p-2 bg-white dark:bg-black rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Set both to 0 to disable automated batch sleeping.
          </p>
        </div>

        <div className="mb-4 mx-4 flex flex-col">
          <label className="mb-2">{this.countryCodePrefixMessageForm}</label>
          <SelectCountryCode />
        </div>
      </Box>
    );
  }
}
