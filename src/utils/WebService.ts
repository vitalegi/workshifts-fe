import { factory } from "@/utils/ConfigLog4j";
import { timestamp } from "@/utils/Decorators";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import EventBus from "./EventBus";

export class WebService {
  protected logger = factory.getLogger("utils.WebService");

  private _url = "";
  private _method:
    | "get"
    | "delete"
    | "head"
    | "options"
    | "post"
    | "put"
    | "patch"
    | "link"
    | "unlink"
    | "GET"
    | "DELETE"
    | "HEAD"
    | "OPTIONS"
    | "POST"
    | "PUT"
    | "PATCH"
    | "LINK"
    | "UNLINK"
    | undefined = undefined;
  private _headers: any = {};
  private _responseType:
    | "json"
    | "arraybuffer"
    | "blob"
    | "document"
    | "text"
    | "stream"
    | undefined = "json";
  private _spinner = true;

  private _requestSerializer: (request: object) => any = (request: object) =>
    JSON.stringify(request);

  public url(url: string): WebService {
    this._url = url;
    return this;
  }
  public header(name: string, value: string): WebService {
    this._headers[name] = value;
    return this;
  }
  public responseType(
    responseType:
      | "json"
      | "arraybuffer"
      | "blob"
      | "document"
      | "text"
      | "stream"
      | undefined
  ): WebService {
    this._responseType = responseType;
    return this;
  }
  public headerJson(): WebService {
    this.header("Content-Type", "application/json; charset=utf-8");
    return this;
  }
  public method(
    method:
      | "get"
      | "delete"
      | "head"
      | "options"
      | "post"
      | "put"
      | "patch"
      | "link"
      | "unlink"
      | "GET"
      | "DELETE"
      | "HEAD"
      | "OPTIONS"
      | "POST"
      | "PUT"
      | "PATCH"
      | "LINK"
      | "UNLINK"
      | undefined
  ): WebService {
    this._method = method;
    return this;
  }
  public get(): WebService {
    return this.method("get");
  }
  public post(): WebService {
    return this.method("post");
  }
  public requestSerializer(serializer: (request: object) => any): WebService {
    this._requestSerializer = serializer;
    return this;
  }

  public spinner(spinner: boolean): WebService {
    this._spinner = spinner;
    return this;
  }

  public call(payload: object) {
    const startTime = timestamp();
    const callName = this._url;
    const instance = axios.create();

    instance.interceptors.request.use((config: AxiosRequestConfig) => {
      this.logger.debug(() => `Call ${config.url} start`);
      return config;
    });
    instance.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        const duration = timestamp() - startTime;
        this.logger.info(
          () =>
            `Call ${response.config.url} end [${duration}] status [${response.status}] ${response.statusText}`
        );
        return response;
      },
      (error: any) => {
        const duration = timestamp() - startTime;
        this.logger.error(
          () => `Call ${error.config.url} failed [${duration}]`
        );
        throw new Error(
          `Call ${error.config.url} failed, status: ${error.response.status}`
        );
      }
    );

    instance.interceptors.request.use((config: AxiosRequestConfig) => {
      if (this._spinner) {
        EventBus.$emit("ASYNC_ACTION_START", callName);
      }
      return config;
    });

    instance.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        if (this._spinner) {
          EventBus.$emit("ASYNC_ACTION_END", callName);
        }
        return response;
      },
      (error: any) => {
        if (this._spinner) {
          EventBus.$emit("ASYNC_ACTION_END", callName);
        }
        throw error;
      }
    );

    return instance({
      url: this._url,
      method: this._method,
      headers: this._headers,
      responseType: this._responseType,
      data: this._requestSerializer(payload)
    });
  }
}

export class BackendWebService extends WebService {
  private configs = [
    {
      env: "test",
      frontendUrls: ["http://localhost:8080"],
      backendUrl: "http://localhost:8081"
    },
    {
      env: "prod",
      frontendUrls: ["http://vitalegi.ovh", "https://vitalegi.ovh"],
      backendUrl: "https://vitalegi.ovh"
    }
  ];

  public url(url: string): WebService {
    const fullUrl = this.getBackendUrl() + url;
    this.logger.debug(
      () =>
        `BackendURL: ${this.getBackendUrl()} URL: ${url} WindowLocation: ${
          window.location
        }`
    );
    return super.url(fullUrl);
  }
  protected getBackendUrl(): string {
    const url = this.getCurrentUrl();
    const configs = this.configs.filter(
      cfg =>
        cfg.frontendUrls.filter(frontendUrl => frontendUrl == url).length > 0
    );
    if (configs.length == 1) {
      return configs[0].backendUrl;
    }
    this.logger.error(
      () => `Unrecognized environment: ${url}. Fallback to default.`
    );
    return url;
  }
  protected getCurrentUrl(): string {
    return (
      location.protocol +
      "//" +
      location.hostname +
      (location.port ? ":" + location.port : "")
    );
  }
}
