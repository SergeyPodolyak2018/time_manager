import axios from './axios';
import { assocPath, path } from 'ramda';
import Utils from '../helper/utils';
import { IResponse } from './ts/interfaces/response';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiHelpers {
  constructor() {}

  splitDataIntoChunks<T>(data: T[]): T[][] {
    const maxChunkSizeInBytes = Number(Utils.REQUEST_CHUNK_SIZE_IN_BYTES);
    const textEncoder = new TextEncoder();
    let currentChunk: T[] = [];
    let currentChunkSize = 0;
    const chunks = [];

    if (!data?.length) {
      return [data];
    }
    for (const item of data) {
      const itemBytes = textEncoder.encode(JSON.stringify(item));
      const itemSize = itemBytes.length;

      if (currentChunkSize + itemSize > maxChunkSizeInBytes) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentChunkSize = 0;
      }

      currentChunk.push(item);
      currentChunkSize += itemSize;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    return chunks;
  }

  /**
   *
   * @param url
   * @param payload
   * @param pathToDataInPayload
   * @param config
   */
  async sendRequestInChunks<Res, Err>(
    url: string,
    payload: any,
    pathToDataInPayload: string[],
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<IResponse<Res, Err>> | null> {
    const data = path<any[]>(pathToDataInPayload, payload);
    if (!data) throw new Error(`Data in chunk not founded, path: ${pathToDataInPayload}, payload: ${payload}`);
    const chunks = this.splitDataIntoChunks(data);
    const length = data?.length;
    let counter = 0;

    let response = null;
    for (const chunk of chunks) {
      let _payload = assocPath(pathToDataInPayload, chunk, payload);
      _payload = assocPath(['count'], length, _payload);
      counter += chunk.length;
      _payload = assocPath(['uploaded'], counter, _payload);

      response = await axios.post<IResponse<Res, Err>>(url, _payload, config);
    }
    return response;
  }
  //
  // async tryNTimes(N: number, cb: () => void) {
  //   let counter = N;
  //   try {
  //     return cb();
  //   } catch (e) {
  //     counter = counter - 1;
  //     tryNTimes;
  //   }
  // }

  // Custom request transformer
  // gzipTransformer: AxiosRequestTransformer = (data, headers) => {
  //   // Compress strings if over 1KB
  //   if (JSON.stringify(data).length > 1024) {
  //     headers['Content-Encoding'] = 'gzip';
  //     return pako.gzip(JSON.stringify(data));
  //   } else {
  //     // Remove Content-Encoding if size is not over 1KB
  //     delete headers['Content-Encoding'];
  //     return JSON.stringify(data);
  //   }
  // };
}

const apiHelpers = new ApiHelpers();
export default apiHelpers;
