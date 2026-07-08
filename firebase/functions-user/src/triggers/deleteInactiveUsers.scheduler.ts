import {auth} from "functions-shared";
import {onSchedule} from "firebase-functions/scheduler";

const DAYS_TO_EXPIRE = 7;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const deleteInactiveUsers = onSchedule(
  {
    schedule: "59 23 * * *",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = Date.now();
    let token: string | undefined;

    do {
      const {users, pageToken} = await auth.listUsers(1000, token);

      const toDelete = users
        .filter((user) => {
          if (user.customClaims?.["complete"]) return false;
          const createdAt = new Date(user.metadata.creationTime).getTime();

          return now - createdAt > DAYS_TO_EXPIRE * MS_IN_DAY;
        })
        .map((u) => u.uid);

      if (toDelete.length > 0) {
        await auth.deleteUsers(toDelete);
      }

      token = pageToken;
    } while (token);
  },
);
