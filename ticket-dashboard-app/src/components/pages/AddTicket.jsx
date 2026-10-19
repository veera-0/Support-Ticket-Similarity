import Footer from "../footer/Footer";
import Header from "../header/Header";
import TicketForm from "../main/newTicket/TicketForm";
import useEffect from "react";


export default function AddTicket() {
    useEffect(() => {
        document.title = 'Add New Ticket';
    }, []);

    return(
        <>
            <Header/>
            <TicketForm/>
            <Footer/>
        </>
    )
}