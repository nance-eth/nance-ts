export const getTitle = (page) => {
  // notion api sometimes splits out the title into
  // multiple objects, map into single string separated by ' '
  return page.properties.Name.title.map((t) => {
    return t.plain_text;
  }).join(' ');
};

export const getRichText = (page, property) => {
  return page.properties[property].rich_text[0].plain_text;
};

export const getCategory = (page) => {
  return page.properties.Category.multi_select.map((p) => {
    return p.name;
  }).join(' & ');
};

export const getURL = (page) => {
  return page.url;
};
