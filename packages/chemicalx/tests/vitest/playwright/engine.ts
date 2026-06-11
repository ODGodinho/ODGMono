import type {
    Browser,
    BrowserContext,
    BrowserContextOptions,
    BrowserType,
    LaunchOptions,
    Page,
} from "playwright";

import type { Browser as BrowserClass } from "./Browser";
import type { Context as ContextClass } from "./Context";
import type { Page as PageClass } from "./Page";

export type BrowserTypeEngine = BrowserType;

export type BrowserOptionsEngine = LaunchOptions;

export type ContextOptionsEngine = BrowserContextOptions;

export type BrowserClassEngine = Browser;

export type ContextClassEngine = BrowserContext;

export type PageClassEngine = Page;

export type MyBrowser = BrowserClass & BrowserClassEngine;

export type MyPage = PageClass & PageClassEngine;

export type MyContext = ContextClass & ContextClassEngine;

export { chromium as browserEngine } from "playwright";
