import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appRotateArrow]'
})
export class RotateArrowDirective {

  constructor(private elem: ElementRef, private renderer: Renderer2) { }

  @HostListener('click') onClickSideOption() {
    const sideOptionTag = this.elem.nativeElement as HTMLDivElement;
    const childrenNodes = sideOptionTag.children;

    for(let index in childrenNodes) {
      if(!isNaN(Number(index)) && Object.values(childrenNodes[index].classList).includes('drop-icon')){
        this.setAnimationStyle(childrenNodes[index].children[0]);
      }
    }
  }

  setAnimationStyle(elem) {
    const lastAnimationName = elem.style.animationName;

    if(lastAnimationName == '' || lastAnimationName == 'dropdownOrigin') {
      this.elem.nativeElement.style.borderBottom = 'none';
      elem.style.animationName = 'dropdownRotate';
      elem.style.rotate = '0deg';
      this.renderer.addClass(this.elem.nativeElement, 'active');
    } else {
      this.elem.nativeElement.style.borderBottom = '1px solid #d9d9d9';
      elem.style.animationName = 'dropdownOrigin';
      elem.style.rotate = '180deg';
      this.renderer.removeClass(this.elem.nativeElement, 'active');
    }
  }
}
