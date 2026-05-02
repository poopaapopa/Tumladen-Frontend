/**
 * Возвращает правильную форму русского слова в зависимости от числа.
 * forms: [одно, два-четыре, пять-двадцать]
 * Например: pluralize(5, ['очко', 'очка', 'очков']) => 'очков'
 */
export const pluralizeRu = (n: number, forms: [string, string, string]): string => {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
};

export const pluralizePoints = (n: number): string =>
  pluralizeRu(n, ['очко', 'очка', 'очков']);
