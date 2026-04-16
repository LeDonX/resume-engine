import { bindResumeAppEvents } from "./bind-events.js";
import { createResumeApp } from "./create-resume-app.js";
import { getAppDom } from "./dom.js";
import { createResumeAppPublicApi } from "./public-api.js";

export async function startResumeApp() {
    const dom = getAppDom();
    const app = createResumeApp({ dom });

    bindResumeAppEvents({ app, dom });
    window.__resumeApp__ = createResumeAppPublicApi(app);

    await app.initializeApp();

    return app;
}
