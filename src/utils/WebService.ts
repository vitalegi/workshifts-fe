import { factory } from "@/utils/ConfigLog4j";
import { timestamp } from "@/utils/Decorators";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

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

  public url(url: string): WebService {
    this._url = url;
    return this;
  }
  public header(name: string, value: string): WebService {
    this._headers[name] = value;
    return this;
  }
  public json(): WebService {
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
  public call(
    payload: object,
    onSuccess: (
      value: AxiosResponse<any>
    ) =>
      | AxiosResponse<any>
      | PromiseLike<AxiosResponse<any>>
      | null
      | undefined,
    onError?: (reason: any) => PromiseLike<never>
  ) {
    const startTime = timestamp();

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

    if (onError == undefined) {
      onError = (reason: any) => {
        return reason;
      };
    }

    instance({
      url: this._url,
      method: this._method,
      headers: this._headers,
      data: JSON.stringify(payload)
    })
      .then(onSuccess)
      .catch(onError);
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
    console.log(this.getBackendUrl(), url);
    console.log(window.location);
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
    throw new Error(`Unrecognized environment: ${url}`);
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
