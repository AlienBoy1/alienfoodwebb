import { useRouter } from "next/router";
import OrderDetails from "../../components/Order/OrderDetails";
import Head from "next/head";
import BackButton from "../../components/BackButton/BackButton";

function orderDetails() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Alien Food | Detalles del Pedido</title>
      </Head>
      <div className="heightFix px-6 py-10">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <OrderDetails id={router.query?.id} />
        </div>
      </div>
    </>
  );
}

orderDetails.auth = true;
export default orderDetails;
