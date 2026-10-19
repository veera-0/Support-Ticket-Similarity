import Footer from "../footer/Footer";
import Header from "../header/Header";
import Main from "../main/Main";
import {useEffect} from "react";

function Home() {

    useEffect(() => {
            document.title = 'FDE Support Ticket Dashboard';
        }, []);

    return(
        <>
            <Header/>
            <Main/>
            <Footer/>
        </>
    )
}

export default Home;