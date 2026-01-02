import { Directive, ElementRef, HostListener, Input, Renderer2,VERSION } from '@angular/core';

@Directive({
  selector: '[appOnhoverClick]'
})
export class OnhoverClickDirective {
  @Input() appOnhoverClick:string = "";
  values:any = {code: 'tempCode', locator: 'tempLocator', country: 'tempCountry'};
  // values:any = {code: '-15', locator: '-70', country: '-35'};

  constructor(private el: ElementRef, private renderer: Renderer2) { }

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
