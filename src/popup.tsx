import { type ChangeEvent, Component, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import "index.css";
import Button from "components/atoms/Button";
import { ControlTextArea } from "components/atoms/ControlFactory";
import Box from "components/molecules/Box";
import { ChromeMessageTypes } from "types/ChromeMessageTypes";
import { type Message } from "types/Message";
import type QueueStatus from "types/QueueStatus";
import AsyncChromeMessageManager from "utils/AsyncChromeMessageManager";

const PopupMessageManager = new AsyncChromeMessageManager("popup");

class Popup extends Component<
  unknown,
  {
    contacts: string;
    duplicatedContacts: number;
    confirmed: boolean;
    status?: QueueStatus | undefined;
  }
> {
  constructor(props: unknown) {
    super(props);
    this.state = {
      contacts: "",
      duplicatedContacts: 0,
      confirmed: true,
      status: undefined,
    };
  }

  duplicatedNumberPopup = chrome.i18n.getMessage("duplicatedNumberPopup");
  sendingMessagePopup = chrome.i18n.getMessage("sendingMessagePopup");
  messageTimePopup = chrome.i18n.getMessage("messageTimePopup");
  sendingPopup = chrome.i18n.getMessage("sendingPopup");
  waitingPopup = chrome.i18n.getMessage("waitingPopup");
  messagesSentPopup = chrome.i18n.getMessage("messagesSentPopup");
  duplicatedContactsPopup = chrome.i18n.getMessage("duplicatedContactsPopup");
  messagesLeftPopup = chrome.i18n.getMessage("messagesLeftPopup");
  messagesNotSentPopup = chrome.i18n.getMessage("messagesNotSentPopup");
  prefixFooterNotePopup = chrome.i18n.getMessage("prefixFooterNotePopup");
  messagePlaceholderPopup = chrome.i18n.getMessage("messagePlaceholderPopup");
  cancelButtonLabel = chrome.i18n.getMessage("cancelButtonLabel");
  okButtonLabel = chrome.i18n.getMessage("okButtonLabel");
  optionsButtonLabel = chrome.i18n.getMessage("optionsButtonLabel");
  sendButtonLabel = chrome.i18n.getMessage("sendButtonLabel");
  defaultMessage = chrome.i18n.getMessage("defaultMessage");

  queueStatusListener = 0;

  override componentDidMount() {
    const body = document.querySelector("body");
    if (!body) return;

    this.updateStatus();
    this.queueStatusListener = window.setInterval(this.updateStatus, 100);
  }

  updateStatus = () => {
    void PopupMessageManager.sendMessage(
      ChromeMessageTypes.QUEUE_STATUS,
      undefined,
    ).then((status) => {
      this.setState({ status });
    });
  };

  override componentWillUnmount() {
    clearInterval(this.queueStatusListener);
  }

  override componentDidUpdate(
    _prevProps: Readonly<unknown>,
    prevState: Readonly<{
      contacts: string;
      confirmed: boolean;
      status?: QueueStatus | undefined;
    }>,
  ) {
    if (!prevState.status?.isProcessing && this.state.status?.isProcessing) {
      this.setState({ confirmed: false });
    }
  }

  handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      contacts: event.target.value,
    });
  };

  parseContacts = (prefix: number) => {
    const prefixToString = (prefix === 0 ? "" : prefix).toString();
    const contactList = this.state.contacts
      .split(/[\n\t;]/)
      .filter((str) => str.trim() !== "");

    this.setState({ duplicatedContacts: 0 });

    const parsedList: { contact: string; name: string }[] = [];
    const uniqueContacts = new Set<string>();

    contactList.forEach((line) => {
      const parts = line.split(",");
      const rawNumber = (parts[0] ?? "").replace(/[\D]*/g, "");
      if (!rawNumber) return;
      const contactNo = prefixToString.concat(rawNumber);
      const name = parts.length > 1 ? parts.slice(1).join(",").trim() : "";

      if (uniqueContacts.has(contactNo)) {
        this.setState((prevState) => ({
          duplicatedContacts: prevState.duplicatedContacts + 1,
        }));
        void PopupMessageManager.sendMessage(ChromeMessageTypes.ADD_LOG, {
          level: 2,
          message: this.duplicatedNumberPopup,
          attachment: false,
          contact: contactNo,
        });
      } else {
        uniqueContacts.add(contactNo);
        parsedList.push({ contact: contactNo, name });
      }
    });

    return parsedList;
  };

  handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const language = chrome.i18n.getUILanguage();
    chrome.storage.local.get(
      ({
        message = this.defaultMessage,
        attachment,
        buttons = [],
        delay = 0,
        randomDelay = false,
        batchSize = 0,
        batchSleep = 0,
        prefix = language === "pt_BR" ? 55 : 0,
      }: Omit<Message, "contact"> & {
        prefix: number;
        randomDelay?: boolean;
        batchSize?: number;
        batchSleep?: number;
      }) => {
        void PopupMessageManager.sendMessage(
          ChromeMessageTypes.SET_BATCH_SETTINGS,
          { batchSize, batchSleep },
        ).then(() => {
          for (const item of this.parseContacts(prefix)) {
            const finalDelay = randomDelay
              ? Math.random() * (15 - 6) + 6
              : delay;
            const personalizedMessage = message.replace(
              /\{\{Name\}\}/gi,
              item.name || "",
            );
            void PopupMessageManager.sendMessage(
              ChromeMessageTypes.SEND_MESSAGE,
              {
                contact: item.contact,
                message: personalizedMessage,
                attachment,
                buttons,
                delay: finalDelay,
              },
            );
          }
        });
      },
    );
    event.preventDefault();
  };

  handleOptions = () => {
    try {
      void chrome.runtime.openOptionsPage();
    } catch {
      window.open(chrome.runtime.getURL("options.html"));
    }
  };

  formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const decimal = (milliseconds % 1000).toString().substr(0, 2); // Gets the first 2 decimal places
    const hoursString = hours > 0 ? `${hours.toString()}h ` : "";
    const minutesString = minutes > 0 ? `${minutes.toString()}m ` : "";
    const secondsString =
      seconds > 0 || (!hoursString && !minutesString)
        ? `${seconds.toString()}.${decimal.toString()}s`
        : `0.${decimal.toString()}s`;

    return `${hoursString}${minutesString}${secondsString}`;
  };

  override render() {
    return (
      <>
        {!this.state.confirmed && (
          <Box
            className="w-96 h-96"
            title={
              this.state.status?.isProcessing ? this.sendingMessagePopup : ""
            }
            footer={
              this.state.status?.isProcessing ? (
                <div className="flex gap-2 w-full justify-between items-center">
                  <Button
                    variant="danger"
                    onClick={() =>
                      void PopupMessageManager.sendMessage(
                        ChromeMessageTypes.STOP_QUEUE,
                        undefined,
                      )
                    }
                  >
                    {this.cancelButtonLabel}
                  </Button>
                  {this.state.status.isPaused ? (
                    <Button
                      variant="success"
                      onClick={() =>
                        void PopupMessageManager.sendMessage(
                          ChromeMessageTypes.RESUME_QUEUE,
                          undefined,
                        )
                      }
                    >
                      Resume
                    </Button>
                  ) : (
                    <Button
                      variant="warning"
                      onClick={() =>
                        void PopupMessageManager.sendMessage(
                          ChromeMessageTypes.PAUSE_QUEUE,
                          undefined,
                        )
                      }
                    >
                      Pause
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    this.setState({ confirmed: true });
                  }}
                >
                  {this.okButtonLabel}
                </Button>
              )
            }
          >
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>{this.messageTimePopup}</div>
              <div>{this.formatTime(this.state.status?.elapsedTime ?? 0)}</div>
              {this.state.status?.processing && (
                <div className="col-span-2">{this.sendingPopup}</div>
              )}
              {this.state.status?.waiting && <div>{this.waitingPopup}</div>}
              {this.state.status?.waiting && (
                <div>
                  {this.formatTime(this.state.status.waiting)}
                  {this.state.status.waitTarget &&
                  typeof this.state.status.waitTarget === "number"
                    ? ` / ${this.formatTime(this.state.status.waitTarget)}`
                    : ""}
                </div>
              )}
              <div>{this.messagesSentPopup}</div>
              <div>{this.state.status?.processedItems}</div>
              <div>
                {this.state.status?.isProcessing
                  ? this.messagesLeftPopup
                  : this.messagesNotSentPopup}
              </div>
              <div>{this.state.status?.remainingItems}</div>
              <div>{this.duplicatedContactsPopup}</div>
              <div>{this.state.duplicatedContacts}</div>
              {this.state.status && (
                <div className="w-full h-5 bg-gray-300 dark:bg-gray-600 rounded-full relative col-span-2 self-end overflow-hidden shadow-inner border border-white/20">
                  <div
                    className={`h-5 rounded-full progress-bar${this.state.status.isProcessing && !this.state.status.isPaused ? " progress-bar-animated" : ""}`}
                    style={{
                      width: `${((this.state.status.processedItems / (this.state.status.processedItems + this.state.status.remainingItems)) * 100).toString()}%`,
                      transition: "width 0.5s ease-in-out",
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      {Math.round(
                        (this.state.status.processedItems /
                          (this.state.status.processedItems +
                            this.state.status.remainingItems)) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Box>
        )}
        {this.state.confirmed && (
          <form onSubmit={this.handleSubmit}>
            <Box
              className="w-96 h-96"
              bodyClassName="p-4"
              footer={this.prefixFooterNotePopup}
            >
              <ControlTextArea
                className="flex-auto bg-white/50 dark:bg-black/50 backdrop-blur-sm placeholder:text-slate-400"
                value={this.state.contacts}
                onChange={this.handleChange}
                placeholder={`${this.messagePlaceholderPopup} (e.g. 919876543210, John)`}
                required
              />
              <div className="flex justify-between items-center">
                <Button variant="primary" type="submit">
                  {this.sendButtonLabel}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={this.handleOptions}
                >
                  {this.optionsButtonLabel}
                </Button>
              </div>
            </Box>
          </form>
        )}
      </>
    );
  }
}

createRoot(document.getElementById("root") ?? document.body).render(<Popup />);
