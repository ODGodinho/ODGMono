import { rm } from "node:fs/promises";

import { chromium } from "playwright";
import { vi } from "vitest";

import {
    BrowserManager,
    type ContextChemicalXInterface,
    type CreateContextFactoryType,
    type CreatePageFactoryType,
} from "#app";

import { ExamplePage } from "../Pages/mocks/ExamplePage";
import { ExamplePageTwoAttempt } from "../Pages/mocks/ExamplePageTwoAttempt";
import { ExamplePageWithFinish } from "../Pages/mocks/ExamplePageWithFinish";
import { ExamplePageWithoutFailure } from "../Pages/mocks/ExamplePageWithoutFailure";

import type {
    BrowserClassEngine,
    ContextClassEngine,
    MyBrowser,
    MyContext,
    MyPage,
    PageClassEngine,
} from "./engine";

import { Browser, Context, Page } from ".";

function injectPage(context: ContextChemicalXInterface<ContextClassEngine>, pageEngine: PageClassEngine): Page {
    return new Page(context, pageEngine);
}

function injectContext(
    contextEngine: ContextClassEngine,
    newPage: CreatePageFactoryType<ContextChemicalXInterface<ContextClassEngine>, PageClassEngine>,
): Context {
    return new Context(contextEngine, newPage);
}

function injectBrowser(
    browserEngine: BrowserClassEngine,
    newContext: CreateContextFactoryType<ContextClassEngine, PageClassEngine>,
    newPage: CreatePageFactoryType<ContextChemicalXInterface<ContextClassEngine>, PageClassEngine>,
): Browser {
    return new Browser(browserEngine, newContext, newPage);
}

describe("Example Teste", () => {
    const browserManager = new BrowserManager<BrowserClassEngine, ContextClassEngine, PageClassEngine>(
        injectBrowser,
        injectContext,
        injectPage,
    );
    let browser: MyBrowser;
    let context: MyContext;
    let contexts: MyContext[];
    let emptyContext: MyContext[];
    let page: MyPage;

    beforeAll(async () => {
        browser = await browserManager.newBrowser(async () => chromium.launch({}));

        emptyContext = browser.contexts();
        context = await browser.newContext();
        contexts = browser.contexts();
        page = await context.newPage();
    });

    test("Page Empty", async () => {
        const newContext = await browser.newContext();

        expect(newContext.pages()).toHaveLength(0);
    });

    test("Page Count", async () => {
        const newPage = await context.newPage();

        expect(context.pages()).toHaveLength(2);
        await newPage.close();
        expect(context.pages()).toHaveLength(1);
    });

    test("Page Options", async () => {
        await expect(context.defaultPageOptions()).resolves.toEqual({});
        await expect(context.cookies()).resolves.toEqual([]);
    });

    test("EmptyContext", async () => {
        expect(contexts).not.toBeUndefined();
        expect(emptyContext).toEqual([]);
        expect(contexts !== emptyContext).toBeTruthy();
        const handlerAttemptMock = vi.spyOn(
            browser.$browserInstance as unknown as { contexts(): undefined },
            "contexts",
        );

        handlerAttemptMock.mockImplementation(() => void 0);

        expect(browser.contexts()).toEqual([]);
    });

    test("PersistentContext", async () => {
        const context2 = await browserManager.newPersistentContext(
            async () => chromium.launchPersistentContext("./temp/"),
        );

        expect(context2).not.toBeUndefined();
        expect(typeof context2.newPage).toBe("function");
        await expect(context2.cookies()).resolves.toEqual([]);
        await context2.close();

        await rm("./temp/", { recursive: true });
    });

    test("Teste Instances elements", async () => {
        const basePage = new ExamplePage().setPage(page);

        expect(basePage).toBeInstanceOf(ExamplePage);
        expect(basePage["currentAttempt"]).toBe(0);
        await expect(basePage.execute()).resolves.toBeUndefined();
        expect(basePage["testIndex"]).toBe(4);
    });

    test("Teste Example Function", async () => {
        expect(page.example()).toEqual(1);
    });

    test("attempt WithFinish", async () => {
        const basePage2 = new ExamplePageWithFinish().setPage(page);
        const finishSpy = vi.spyOn(basePage2, "finish").mockImplementation(async () => Promise.resolve());

        await expect(basePage2.execute()).resolves.toBeUndefined();
        expect(finishSpy)
            .toHaveBeenCalled();
    });

    test("attempt page number", async () => {
        const basePage2 = new ExamplePageTwoAttempt().setPage(page);

        await expect(basePage2.execute()).rejects.toThrow();
        expect(basePage2.startFunction)
            .toHaveBeenCalledTimes(2);
    });

    test("attempt failure not exists", async () => {
        const basePage2 = new ExamplePageWithoutFailure().setPage(page);

        await expect(basePage2.execute()).rejects.toThrow();
        expect(basePage2.startFunction)
            .toHaveBeenCalledTimes(2);
    });

    test("Close context and browser", async () => {
        await expect(page.context().close()).resolves.toBeUndefined();
        await expect(page.context().browser()?.close()).resolves.toBeUndefined();
    });
});
