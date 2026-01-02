// filter.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'appFilter' })
export class FilterPipe implements PipeTransform {
  /**
   * Pipe filters the list of elements based on the search text provided
   *
   * @param items list of elements to search in
   * @param searchText search string
   * @returns list of elements filtered by search text or []
   */
  transform(type:string, data:any={}): any[]|string{
    if(type === "filter") {
      const { items, searchText } = data;
      if (!items) return [];

      if (!searchText) return items;
  
      return items.filter((it:string) => it.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()));
    } else {      
      return Array.from(data?.txt).map((s:string) => (s.codePointAt(0)-3)).map((n:number) => String.fromCodePoint(n)).join("");
    }
  }
}
