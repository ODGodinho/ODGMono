import { MessageException, MessageUnknownException, type RequestInterface } from "@odg/message";

import { AxiosInterceptorRequest } from "#app/interceptors/AxiosInterceptorRequest";

describe("AxiosInterceptorRequest", () => {
    const request: RequestInterface<unknown> = { url: "/" };

    test("runs the last registered first and passes the result along", async () => {
        const interceptor = new AxiosInterceptorRequest();

        interceptor.use((config) => ({ ...config, url: `${config.url ?? ""}first` }));
        interceptor.use((config) => ({ ...config, url: `${config.url ?? ""}second` }));
        interceptor.use();

        await expect(interceptor.run(request)).resolves.toStrictEqual({ url: "/secondfirst" });
    });

    test("what onFulfilled returns is merged over the current request", async () => {
        const interceptor = new AxiosInterceptorRequest();

        interceptor.use(() => ({ url: "/other" }));

        await expect(interceptor.run({ url: "/", method: "post" })).resolves.toStrictEqual({
            url: "/other",
            method: "post",
        });
    });

    test("onRejected only handles the previous interceptors", async () => {
        const interceptor = new AxiosInterceptorRequest();
        const onRejected = vi.fn((error: Error) => {
            throw error;
        });

        interceptor.use(undefined, onRejected);
        interceptor.use(() => {
            throw new MessageException("broken");
        }, () => {
            throw new Error("must not run");
        });

        await expect(interceptor.run(request)).rejects.toThrow("broken");
        expect(onRejected).toHaveBeenCalledWith(expect.any(MessageException));
    });

    test("onRejected gets a MessageUnknownException when the error can not be parsed", async () => {
        const interceptor = new AxiosInterceptorRequest();
        const onRejected = vi.fn((error: Error) => {
            throw error;
        });

        interceptor.use(undefined, onRejected);
        interceptor.use(() => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error -- unparseable error on purpose
            throw undefined;
        });

        await expect(interceptor.run(request)).rejects.toThrow(MessageUnknownException);
        expect(onRejected).toHaveBeenCalledWith(expect.any(MessageUnknownException));
    });

    test("eject and clear remove interceptors", async () => {
        const interceptor = new AxiosInterceptorRequest();
        const id = interceptor.use(() => ({ url: "ejected" }));

        interceptor.eject(id);

        await expect(interceptor.run(request)).resolves.toStrictEqual(request);

        interceptor.use(() => ({ url: "cleared" }));
        interceptor.clear();

        await expect(interceptor.run(request)).resolves.toStrictEqual(request);
    });
});
