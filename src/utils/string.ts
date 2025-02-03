// 文字列の先頭を大文字に変換する関数
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
