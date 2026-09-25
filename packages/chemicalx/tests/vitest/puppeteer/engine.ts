import type {
    Browser,
    BrowserContext,
    LaunchOptions,
    Page,
    PuppeteerNode,
} from "puppeteer";

import type { Browser as BrowserClass } from "./Browser.ts";
import type { Context as ContextClass } from "./Context.ts";
import type { Page as PageClass } from "./Page.ts";

export type BrowserTypeEngine = PuppeteerNode;

export type BrowserClassEngine = Browser;

export type ContextClassEngine = BrowserContext;

export type PageClassEngine = Page;

export type BrowserOptionsEngine = LaunchOptions;

export type MyBrowser = BrowserClass & BrowserClassEngine;

export type MyPage = PageClass & PageClassEngine;

export type MyContext = ContextClass & ContextClassEngine;

export { default as browserEngine } from "puppeteer";
