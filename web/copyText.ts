/**
 * copyText
 * @Author: liwb (lwbhtml@163.com)
 * @Date: 2023-01-13 16:18
 * @LastEditTime: 2023-01-13 16:18
 * @Description: copyText
 */
import Clipboard from 'clipboard';

export function copyText(text: string) {
  const div = document.createElement('div');
  const clip = new Clipboard(div, {
    text() {
      return text;
    },
  });
  div.click();
  clip.destroy();
  div.remove();
}
