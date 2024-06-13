const { createApp, ref, reactive, computed, onMounted, nextTick } = Vue;
import { minidenticonSvg } from "https://cdn.jsdelivr.net/npm/minidenticons@4.2.1/minidenticons.min.js";

const { liveQuery } = Dexie;
var db = new Dexie("StudyDatabase");
var subscription = null;

dayjs.locale("fr");
dayjs.extend(dayjs_plugin_relativeTime);

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const getSubscription = async (registration) => {
  subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const response = await fetch(
      "https://follyepiphaneavlah.alwaysdata.net/push-server/vapidPublicKey"
    );
    const vapidPublicKey = await response.text();

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
  }

  fetch("https://follyepiphaneavlah.alwaysdata.net/push-server/register", {
    method: "post",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      subscription: subscription,
    }),
  });
};

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      var serviceWorker = null;

      if (registration.installing) {
        serviceWorker = registration.installing;
      } else if (registration.waiting) {
        serviceWorker = registration.waiting;
      } else if (registration.active) {
        serviceWorker = registration.active;
      }

      if (serviceWorker) {
        if (serviceWorker.state === "activated") {
          getSubscription(registration);
        }

        serviceWorker.addEventListener("statechange", async (e) => {
          if (e.target.state == "activated") {
            getSubscription(registration);
          }
        });
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

const CACHE_VERSION = 1;

const app = createApp({
  setup() {
    const userId = ref(localStorage.getItem("userId"));
    const userPseudo = ref(localStorage.getItem("pseudo"));

    const show = ref(false);
    const channels = ref([]);
    const channelTitle = ref("");
    const currentChannelId = ref(null);
    const messages = ref([]);

    const messageInProgress = ref(false);
    const newMessage = ref("");

    const textareaRef = ref(null);

    const userFormDisabled = computed(() => {
      return !userForm.pseudo;
    });

    const messageBoxDisabled = computed(() => {
      return !newMessage.value;
    });

    const userNotExist = computed(() => {
      return userId.value === null || userId.value === "";
    });

    onMounted(() => {
      registerServiceWorker();

      db.version(1).stores({
        channels: "++id, label",
        messages:
          "++id, senderId, senderPseudo, channelId, createdAt, updatedAt, likes, dislikes, action",
      });

      db.channels
        .bulkPut([
          {
            id: 1,
            label: "Général",
            description:
              "Le Canal étudiant pour échanger sur la vie universitaire, les cours et les événements.",
          },
          {
            id: 2,
            label: "PWA",
            description:
              "Canal PWA : discussions sur le développement et les meilleures pratiques des Progressive Web Apps.",
          },
          {
            id: 3,
            label: "MVC",
            description:
              "Canal MVC : Échanges sur l'architecture Model-View-Controller, conseils, et meilleures pratiques.",
          },
        ])
        .then(() => {
          return db.channels.toArray();
        })
        .then((channelsArray) => {
          channels.value = channelsArray;
          return db.messages.count();
        })
        .then((count) => {
          if (count === 0) {
            insertInitialMessages();
          }
        })
        .catch((err) => {
          console.log(err);
        });

      const channelsObservable = liveQuery(() => db.channels.toArray());
      const channelsSubscription = channelsObservable.subscribe({
        next: (result) => (channels.value = result),
        error: (error) => console.error(error),
      });
    });

    const insertInitialMessages = () => {
      db.messages.bulkPut([
        {
          senderId: "1",
          senderPseudo: "Biloute",
          channelId: 1,
          content:
            "Salut tout le monde! Prêts pour une session de code endiablée?",
          createdAt: dayjs().subtract(2, "day").format(),
          updatedAt: dayjs().subtract(2, "day").format(),
          likes: 1,
          dislikes: 0,
          action: null,
        },
        {
          senderId: "2",
          senderPseudo: "Fifi",
          channelId: 1,
          content:
            "Salut Biloute, yes à fond! J'ai hâte de travailler sur notre app PWA",
          createdAt: dayjs().subtract(1, "day").format(),
          updatedAt: dayjs().subtract(1, "day").format(),
          likes: 2,
          dislikes: 0,
          action: null,
        },
        {
          senderId: "3",
          senderPseudo: "Véro",
          channelId: 2,
          content:
            "Quelqu'un travaille sur le projet PWA en ce moment? J'ai besoin de conseils",
          createdAt: dayjs().subtract(12, "hour").format(),
          updatedAt: dayjs().subtract(12, "hour").format(),
          likes: 0,
          dislikes: 0,
          action: null,
        },
        {
          senderId: "1",
          senderPseudo: "Biloute",
          channelId: 3,
          content:
            "Je galère à bien organiser mon code en MVC... faudrait que je reprenne les cours du Professeur NGU LEUBOU !",
          createdAt: dayjs().subtract(6, "hour").format(),
          updatedAt: dayjs().subtract(6, "hour").format(),
          likes: 1,
          dislikes: 1,
          action: null,
        },
        {
          senderId: "4",
          senderPseudo: "Domi",
          channelId: 3,
          content: "Il a tout expliqué.. il suffisait de suivre les cours!",
          createdAt: dayjs().subtract(6, "hour").format(),
          updatedAt: dayjs().subtract(6, "hour").format(),
          likes: 0,
          dislikes: 2,
          action: null,
        },
      ]);
    };

    const showChannel = (channelId, channelLabel) => {
      Notification.requestPermission().then((result) => {
        if (result === "granted") {
          console.log("ALLOWED");
        }
      });
      currentChannelId.value = channelId;
      channelTitle.value = `${channelLabel}`;
      db.messages
        .where({ channelId })
        .sortBy("createdAt")
        .then((values) => {
          messages.value = [...values];
          show.value = true;
          setTimeout(() => {
            const container = document.querySelector(".ant-modal-content");
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          }, 0);
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const hideChannel = () => {
      currentChannelId.value = null;
      show.value = false;
    };

    const likeComment = async (messageId) => {
      const message = messages.value.find((msg) => msg.id === messageId);
      if (!message) return;

      if (message.action === "liked") {
        await db.messages.update(messageId, {
          likes: message.likes - 1,
          action: null,
        });
      } else {
        await db.messages.update(messageId, {
          likes: message.likes + 1,
          dislikes:
            message.action === "disliked"
              ? message.dislikes - 1
              : message.dislikes,
          action: "liked",
        });
      }
      refreshMessages();
    };

    const dislikeComment = async (messageId) => {
      const message = messages.value.find((msg) => msg.id === messageId);
      if (!message) return;

      if (message.action === "disliked") {
        await db.messages.update(messageId, {
          dislikes: message.dislikes - 1,
          action: null,
        });
      } else {
        await db.messages.update(messageId, {
          dislikes: message.dislikes + 1,
          likes: message.action === "liked" ? message.likes - 1 : message.likes,
          action: "disliked",
        });
      }
      refreshMessages();
    };

    const refreshMessages = () => {
      db.messages
        .where({ channelId: currentChannelId.value })
        .sortBy("createdAt")
        .then((values) => {
          messages.value = [...values];
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const userForm = reactive({
      pseudo: "",
    });

    const onSaveUser = ({ pseudo }) => {
      const uuid = crypto.randomUUID();
      localStorage.setItem("userId", uuid);
      localStorage.setItem("pseudo", pseudo);
      userId.value = uuid;
      userPseudo.value = pseudo;
    };

    const sendNewMessage = () => {
      if (newMessage.value.trim() === "") {
        return;
      }

      messageInProgress.value = true;

      setTimeout(() => {
        const message = {
          content: newMessage.value,
          senderId: userId.value,
          senderPseudo: userPseudo.value,
          channelId: currentChannelId.value,
          createdAt: dayjs().format(),
          updatedAt: dayjs().format(),
          likes: 0,
          dislikes: 0,
          action: null,
        };

        db.messages
          .add(message)
          .then((msgId) => {
            messages.value = [...messages.value, { ...message, id: msgId }];
            fetch(
              "https://follyepiphaneavlah.alwaysdata.net/push-server/sendNotification",
              {
                method: "post",
                headers: {
                  "Content-type": "application/json",
                },
                body: JSON.stringify({
                  subscription: subscription,
                  payload: {
                    title: `Nouveau de message de ${userPseudo.value}`,
                    body: newMessage.value,
                  },
                  delay: 0,
                  ttl: 1000,
                }),
              }
            );
            newMessage.value = "";

            const textarea = document.querySelector(".message-input");
            if (textarea) {
              textarea.style.height = "33px";
            }

            setTimeout(() => {
              const container = document.querySelector(".ant-modal-content");
              if (container) {
                container.scrollTop = container.scrollHeight;
              }
            }, 0);
          })
          .catch((err) => {
            console.log(err);
          })
          .finally(() => {
            messageInProgress.value = false;
            nextTick(() => {
              textareaRef.value?.focus();
            });
          });
      }, 1000);
    };

    const isCurrentUser = (senderId) => {
      return senderId === userId.value;
    };

    const handleKeydown = (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendNewMessage();
      }
    };

    const autoResize = (e) => {
      const textarea = e.target;
      if (textarea.value.trim() === "") {
        textarea.style.height = "33px";
      } else {
        textarea.style.height = textarea.scrollHeight + "px";
      }
    };

    const generateAvatarUrl = (label) => {
      const baseUrl = "https://ui-avatars.com/api/";
      const params = new URLSearchParams({
        name: label,
        background: "#02bd00", //random
        length: 1,
        size: 128,
        rounded: true,
      });
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      show,
      channels,
      channelTitle,
      userId,
      userPseudo,
      userNotExist,
      userForm,
      userFormDisabled,
      newMessage,
      messages,
      textareaRef,
      messageInProgress,
      messageBoxDisabled,
      showChannel,
      hideChannel,
      likeComment,
      dislikeComment,
      onSaveUser,
      sendNewMessage,
      isCurrentUser,
      handleKeydown,
      autoResize,
      dayjs,
      generateAvatarUrl,
    };
  },
});

app.directive("immediate-input", {
  mounted(el) {
    el.addEventListener("input", () => {
      el.dispatchEvent(new Event("change"));
    });
  },
});
app.use(antd);
app.mount("#app");
