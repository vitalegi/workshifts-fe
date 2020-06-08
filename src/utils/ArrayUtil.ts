export class ArrayUtil {
  public static delete<E>(list: E[], match: (e: E) => boolean): void {
    for (let i = 0; i < list.length; i++) {
      if (match(list[i])) {
        list.splice(i, 1);
        i--;
      }
    }
  }
}
