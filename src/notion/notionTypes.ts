export enum NotionFilterName {
  preDiscussion = 0,
  discussion = 1,
  proposalId = 2,
  temperatureCheck = 3,
  voting = 4,
}

// extracted from notion lib
export declare type QueryDatabaseParameters =
  QueryDatabasePathParameters & QueryDatabaseBodyParameters;

declare type QueryDatabasePathParameters = {
  database_id: string;
};

export declare type QueryDatabaseBodyParameters = {
  sorts?: Array<
  | {
    property: string;
    direction: 'ascending' | 'descending';
  }
  | {
    timestamp: 'created_time' | 'last_edited_time';
    direction: 'ascending' | 'descending';
  }
  >;
  filter?: {
    or: Array<
    | PropertyFilter | {
      or: Array<PropertyFilter>;
    } | {
      and: Array<PropertyFilter>;
    } >;
  }
  | {
    and: Array<
    | PropertyFilter | {
      or: Array<PropertyFilter>;
    } | {
      and: Array<PropertyFilter>;
    } >;
  }
  | PropertyFilter;
  start_cursor?: string;
  page_size?: number;
  archived?: boolean;
};

export declare type TextPropertyFilter = {
  equals: string;
};

export declare type SelectPropertyFilter = {
  equals: string;
};

declare type MultiSelectPropertyFilter =
  | {
    contains: string;
  } | {
    does_not_contain: string;
  };

export declare type PropertyFilter =
  | {
    title: TextPropertyFilter;
    property: string;
    type?: 'title';
  }
  | {
    rich_text: TextPropertyFilter;
    property: string;
    type?: 'rich_text';
  }
  | {
    select: SelectPropertyFilter;
    property: string;
    type?: 'select';
  }
  | {
    multi_select: MultiSelectPropertyFilter;
    property: string;
    type?: 'multi_select';
  }
  | {
    url: TextPropertyFilter;
    property: string;
    type?: 'url';
  }
  | {
    email: TextPropertyFilter;
    property: string;
    type?: 'email';
  }
  | {
    phone_number: TextPropertyFilter;
    property: string;
    type?: 'phone_number';
  };
