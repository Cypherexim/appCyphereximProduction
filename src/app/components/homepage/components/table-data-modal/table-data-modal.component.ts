import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertifyService } from 'src/app/services/alertify.service';

@Component({
  selector: 'app-table-data-modal',
  templateUrl: './table-data-modal.component.html',
  styleUrls: ['./table-data-modal.component.css']
})
export class TableDataModalComponent implements OnInit {
  tableData:any[] = [];
  popupName:string = "Shipment";
  unwantedCols:string[] = ["total_records", "RecordID", "isBookmarked", "isChecked"]

  constructor(
    private activeModal: NgbActiveModal,
    private datePipe: DatePipe,
    private alertService: AlertifyService
  ) { }

  ngOnInit(): void {}

  isExist(key):boolean {return this.unwantedCols.includes(key);}

  getValues(item) {
    if(["DATE", "Date", "date"].includes(item.key)) {
      return this.alertService.dateInFormat(item.value);
    } else return item.value;
  }

  closeModal() {this.activeModal.dismiss('Cross click');}
}
