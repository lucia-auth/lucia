import { NodeRequestContext } from "./node.js";

import type { NodeIncomingMessage, NodeOutGoingMessage } from "./node.js";
import type { RequestContext } from "../core.js";

export class H3RequestContext extends NodeRequestContext implements RequestContext {
	constructor(event: H3Event) {
		super(event.node.req, event.node.res);
	}
}

interface H3Event {
	node: {
		req: NodeIncomingMessage;
		res: NodeOutGoingMessage;
	};
}
