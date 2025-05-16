import express, { response } from "express";
import session from 'express-session';
import bodyParser from "body-parser";
import axios from 'axios';

const app = express();
const port = 2000;
var authorize = false;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function billPayment(req, res, next) {

    var userName = req.body["username"];
    var password = req.body["password"];

    if (userName === "Kirubelwinner@gmail.com") {
        if (password === "Agent#23") {
            authorize = true;
            next();
        }
    }

    else {
        res.render("index.ejs", { credentialsError: "Invalid username or password." });
    }

}

app.use(session({
    secret: '7xn7eniebjvfgwl60oeem5ou0qp8fo829hux',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.get("/", (req, res) => {
    res.render("index.ejs");
});


app.post("/billPaymentPage", billPayment, (req, res) => {
    if (authorize) {
        res.render("billPaymentPage.ejs");
    }
    else {
        res.redirect("/");
    }
});

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQWRkaXMgSW50ZXJuYXRpb25hbCBCYW5rIiwic3ViIjoiMTE2NjA1IiwicGVybWlzc2lvbnMiOlsiQUdFTlQiXSwiaXNzIjoiaHR0cHM6Ly9hcGkuZGVyYXNoLmdvdi5ldCIsImp0aSI6IjJlN2NiYjAwLTJiOTEtMTFlYS04MjE4LTViZjM2Yjc1MmYyMyIsImlhdCI6MTU3Nzc3MTMxM30.h_R7VrYVaMeLF_VhMPTPwFL1XCCPf3VqCC-0iihFvrU';
const apiSecret = '7xn7eniebjvfgwl60oeem5ou0qp8fo829hux';

app.get("/getbill", async (req, res) => {
    const billIDInput = req.query["billId"];
    const apiUrl = `https://api.qa.derash.gov.et/agent/customer-bill-data?biller_id=215521&bill_id=${billIDInput}`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                "api-key": apiKey,
                "api-secret": apiSecret,
            }
        });

        const billData = response.data;
        console.log(billData);
        res.render("billPaymentPage.ejs", { billData: billData });
    } 
    catch (error) {
        if (error.response.data.error === "Payment Required") {
            res.render("billPaymentPage.ejs", { payError: `Bill with Bill Id: ${billIDInput} is already paid!` });
        }
        if (error.response.data.error === "Not Found"){
            res.render("billPaymentPage.ejs", { payError: `There is no Bill with Bill Id: ${billIDInput}!` });
        }
    }
});

app.post("/billPayment", async (req, res) => {
    const maniId = req.body["manifestid"];
    const billId = req.body["billid"];
    const amount = req.body["amount"];
    const paidDate = req.body["paiddate"];
    const payerMobile = req.body["payermobile"];
    const paidAt = req.body["paidat"];
    const txnCode = req.body["txncode"];
    console.log(req.body);

    const apiURL = 'https://api.qa.derash.gov.et/agent/customer-bill-data';

    try {
        const response = await axios.post(apiURL, {
            manifest_id: maniId,
            bill_id: billId,
            amount: amount,
            paid_dt: paidDate,
            payee_mobile: payerMobile,
            paid_at: paidAt,
            txn_code: txnCode
        }, {
            headers: {
                "api-key": apiKey,
                "api-secret": apiSecret,
                'Content-Type': 'application/json'
            }
        });

        console.log("Bill was Paid successfully");

        const confirmationCode = response.data.confirmation_code;

        res.render("billPaymentPage.ejs", { confirmationCode });

    } catch (errorPayment) {
        console.error("Error paying bill:", errorPayment);
        res.render("billPaymentPage.ejs", { errorPayment: "There was an error paying the bill." });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.render('billuploadpage.js');
        }
        res.render('index.ejs');
    });
});

app.listen(port, () => {
    console.log(`Server has started on port ${port}`);
});