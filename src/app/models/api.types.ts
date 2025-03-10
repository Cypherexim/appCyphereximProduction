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

export interface CompanyFetchBody {
    countryname: string;
    companyname: string;
    direction: string;
    date: string;
    sameCompanyCountry: boolean;
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
    keysArr: string[],
    direction: string,
    isSameCountryCompany: boolean
}

