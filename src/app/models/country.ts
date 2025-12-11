const getLocatorStatus = (colName:string) => (colName=="both" 
    ? {Exp_Name: true, Imp_Name: true}
    : colName=="Exp_Name" 
        ? {Exp_Name: true, Imp_Name: false}
        : {Exp_Name: false, Imp_Name: true}
);

export class CountryHeads {
    India = {
        import: {
            Date: "DATE",
            HsCode: "TARIFF CODE",
            ProductDesc: "ITEM DESCRIPTION",
            Exp_Name: "SUPPLIER",
            Imp_Name: "BUYER",
            CountryofOrigin: "COUNTRY",
            uqc: "UQC",
            Mode: "MODE",
            Quantity: "QTY",
            Currency: "CURRENCY",
            UnitPriceFC: "UNT PRICE FC",
            InvValueFC: "EST VALUE FC",
            Duty_USD: "TAX US$ + OTHER CHARGES",
            Duty_PCNTG: "TAX %",
            Exchange_Rate: "EXCHANGE RATE",
            Importer_Value_USD: "TOTAL VALUE US$",
            ValueInUSD: "EST VALUE US$",
            PortofOrigin: "LOADING POINT",
            PortofDestination: "DISCHARGE POINT"
        },    
        export: {
            Date: "DATE",
            HsCode: "TARIFF CODE",
            ProductDesc: "ITEM DESCRIPTION",
            Exp_Name: "SUPPLIER",
            Imp_Name: "BUYER",
            CountryofDestination: "COUNTRY",
            uqc: "UQC",
            Mode: "MODE",
            Quantity: "QTY",
            Currency: "CURRENCY",
            UnitPriceFC: "UNT PRICE FC",
            InvValueFC: "EST_VALUE FC",
            ValueInUSD: "EST_VALUE US$",
            Exchange_Rate: "EXCHANGE RATE",
            PortofDestination: "DISCHARGE POINT",
            PortofOrigin: "LOADING POINT",
            Updated_Imp_Name: "UPDATED BUYER",
        },
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Srilanka = { 
        import: {}, 
        export: {}, 
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Philip = { 
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Ethiopia = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Chile = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("Exp_Name"),
            import: getLocatorStatus("Imp_Name")
        }
    };
    Russia = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Turkey = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Bangladesh = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Lesotho = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Usa = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Nigeria = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Vietnam = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Mexico = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Kenya = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Columbia = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Paraguay = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Peru = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Uganda = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Brazil = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Pakistan = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Namibia = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Ecuador = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Weekly = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Argentina = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("Exp_Name"),
            import: getLocatorStatus("Imp_Name")
        }
    };
    Bolivia = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Burundi = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Botswana = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Ghana = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Cameroon = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Indonesia = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    Ivorycost = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    };
    ANY = {
        import: {}, 
        export: {},
        locators: {
            export: getLocatorStatus("both"),
            import: getLocatorStatus("both")
        }
    }

    countryLogs = {
        ANY: this.ANY,
        India: this.India,
        Srilanka: this.Srilanka,
        Ethiopia: this.Ethiopia,
        Chile: this.Chile,
        Philip: this.Philip,
        Bangladesh: this.Bangladesh,
        Turkey: this.Turkey,
        Russia: this.Russia,
        Lesotho: this.Lesotho,
        Usa: this.Usa,
        Nigeria: this.Nigeria,
        Vietnam: this.Vietnam,
        Mexico: this.Mexico,
        Kenya: this.Kenya,
        Columbia: this.Columbia,
        Paraguay: this.Paraguay,
        Peru: this.Peru,
        Uganda: this.Uganda,
        Brazil: this.Brazil,
        Pakistan: this.Pakistan,
        Namibia: this.Namibia,
        Ecuador: this.Ecuador,
        Weekly: this.Weekly,
        Argentina: this.Argentina,
        Bolivia: this.Bolivia,
        Burundi: this.Burundi,
        Botswana: this.Botswana,
        Ghana: this.Ghana,
        Cameroon: this.Cameroon,
        Indonesia: this.Indonesia,
        Ivorycost: this.Ivorycost,
    };

    fetchCountryHeads(country:string) {
        const countryName = country[0].toUpperCase() + country.substring(1, country.length).toLowerCase();
        if(this.countryLogs.hasOwnProperty(countryName)) return this.countryLogs[countryName];
        else return this.countryLogs.ANY;
    }
}
