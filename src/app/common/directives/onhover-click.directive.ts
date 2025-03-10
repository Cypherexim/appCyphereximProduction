import { Directive, ElementRef, HostListener, Input, Renderer2,VERSION } from '@angular/core';

@Directive({
  selector: '[appOnhoverClick]'
})
export class OnhoverClickDirective {
  @Input() appOnhoverClick:string = "";
  values:any = {code: 'tempCode', locator: 'tempLocator', country: 'tempCountry'};
  // values:any = {code: '-15', locator: '-70', country: '-35'};

  constructor(private el: ElementRef, private renderer: Renderer2) { }
  
  // Sumitkumar12@yahoo.com
  // Test@123
  
  // @HostListener('click') onClickSideOption() {
  //   const classList = [...(this.el.nativeElement.classList)];
  //   if(!classList.includes('not-allowed')){
  //     const childrenLen = this.el.nativeElement.children.length;
  //     if(this.el.nativeElement.children[childrenLen-1].classList[1] != "recordTabPopupData") {
  //       setTimeout(() => {
  //         const divElem = document.querySelector('.recordTabPopupData') as HTMLDivElement;
          
  //         // divElem.style.left = this.values[this.appOnhoverClick]+"px !important";
  //         const clonedElem:any = divElem.cloneNode(true);
  //         clonedElem.classList.add(this.values[this.appOnhoverClick]);
  //         this.renderer.appendChild(this.el.nativeElement, clonedElem);
  //       }, 200);
  //     }
  //   }
  // }

  // @HostListener('focusout') onFocusOut() {
  //   const childrenLen = this.el.nativeElement.children.length;
  //   if(this.el.nativeElement.children[childrenLen-1].classList[1] == "recordTabPopupData") {
  //     this.el.nativeElement.lastChild.remove();
  //   }
  // }

  @HostListener('mouseenter') onMouseEnter() {
    if(!["records","values"].includes(this.appOnhoverClick)) {
      this.renderer.removeClass(this.el.nativeElement, 'gray-bgColor');
      this.renderer.addClass(this.el.nativeElement, 'blue-bgColor');
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if(!["records","values"].includes(this.appOnhoverClick)) {
      this.renderer.removeClass(this.el.nativeElement, 'blue-bgColor');
      this.renderer.addClass(this.el.nativeElement, 'gray-bgColor');
    }
  }


}
