const PRODUCTION = process.env.NODE_ENV === "production" || process.env.PRODUCTION_ID_KEYWORD;

export const BUTTON_KEYWORD = PRODUCTION ? "button:" : "DEV:BUTTON:";

export const POLL_KEYWORD = `${BUTTON_KEYWORD}poll:` as const;

export const PUSH_PROPOSAL_KEYWORD = `${BUTTON_KEYWORD}push:` as const;
