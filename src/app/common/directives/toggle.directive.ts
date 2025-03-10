import { Directive,ElementRef,Renderer2,HostListener } from '@angular/core';

@Directive({
  selector: '[appToggle]'
})
export class ToggleDirective {

  constructor(private elem: ElementRef, private renderer: Renderer2) { }

  @HostListener('click') onClickToggle() {
    const className = Object.values(this.elem.nativeElement.classList);
    
    if(className.includes('toggle-btn')){
      this.elem.nativeElement.classList.toggle('active');
    } else {
      this.elem.nativeElement.parentElement.classList.toggle('active');
    }
  } 
}
