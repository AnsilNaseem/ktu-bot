import { axios, agent } from "../config/axiosConfig";
import { ATTACHMENT_URL } from "../constants/constants";
import InvalidDataError from "../errors/InvalidDataError";
import ServerError from "../errors/ServerError";

async function fetchAttachment(encryptId: string): Promise<any> {
  try {
    const response = await axios.post(
      ATTACHMENT_URL,
      {
        encryptId: encryptId,
      },
      {
        httpsAgent: agent,
      },
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      if (
        error.response.status === 400 ||
        (error.response.status === 500 &&
          error.response.data?.message !== "No message available")
      ) {
        throw new InvalidDataError();
      } else if (error.response.status >= 500) {
        throw new ServerError();
      }
    }
    throw new ServerError();
  }
}

export default fetchAttachment;
