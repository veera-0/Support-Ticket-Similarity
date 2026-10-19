
import { getAllTickets } from "../../../service/SemanticSearchService"
import { useState, useEffect } from "react";
import TicketProp from "../../main/ticketProp/TicketProp";
import Header from "../../header/Header";
import Footer from "../../footer/Footer";

function ViewTickets() {

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getTickets = async () => {
            setLoading(true);
            try {
                const results = await getAllTickets();
                setTickets(results);
            } catch (error) {
                console.error('Error getting tickets:', error);
            } finally {
                setLoading(false);
            }
        };

        getTickets();
    }, []);

    return(
        <>
            <Header/>
            <h1>All Tickets</h1>
            {loading ? (
                <p>Loading tickets...</p>
            ) : (
                <ul>
                    {tickets.map((ticket) => (
                        <TicketProp key={ticket.id} ticket={ticket} />
                    ))}
                </ul>
            )}
            <Footer/>
        </>
    )

}

export default ViewTickets;