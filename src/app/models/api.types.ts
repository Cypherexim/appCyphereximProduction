export interface NewCompanyObj {
    company: string;
    userId: number;
    dateTime: string;
}

export interface FeedbackBody{
    userId: number;
    feedback: string;
    time: string;
}

export type CompanyFetchBody = {
    countryname: string;
    companyname: string;
    direction: string;
    date: string;
    // offset: number;
    countryType: string;
    sameCompanyCountry: boolean;
    page: number;
}

export type ApiMsgRes = {
    error: boolean;
    status: number;
    code: number;   
    message: string;
    msg: string;
    result: Array<any>;
    results: Array<any>;
}

export type PivotType = {
    keysArr: string[];
    direction: string;
    isSameCountryCompany: boolean;
}

export type SearchingErrorType = {
    isError: boolean;
    errorMessage: string;
}

export type FavoriteShipmentResType = {
    id: number,
    shipment_ids: string[],
    to_the_order_ids: string[]
}

