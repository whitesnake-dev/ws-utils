/**
 * HTTP request error indicating something went wrong during fetch.
 */
export type HTTPErrorOptions = {
  body?: string;
  statusCode: number;
};

/** HTTP error code type (client - 4xx, server - 5xx) */
export enum ErrorType {
  CLIENT = 'CLIENT',
  SERVER = 'SERVER',
}

export class HTTPError extends Error {
  /** HTTP response status code that was received and is not successful (4xx, 5xx) */
  statusCode: number;

  /** Deserialized object of body, use typeguards to unwrap it, since type is too broad at this moment */
  body: string;

  type: ErrorType;

  constructor(message: string, options: HTTPErrorOptions) {
    super(message);
    this.statusCode = options.statusCode;
    this.body = options.body ?? '';
    this.type = options.statusCode > 500 ? ErrorType.SERVER : ErrorType.CLIENT;
  }
}
