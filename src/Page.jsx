import "./Page.css";
import Functiona from "./Functiona";
export default function Page({
  order,
  pageDir,
  handleNext,
  pageNumber,
  item,
  setOrder,
}) {
  let dir = pageDir === "front" ? "right" : "left";

  return item ? (
    <div className={`page-${pageDir} page`}>
      <div className="content">
        <div className="window">
          <img src={`${item.img}`} alt="" />

          <div className="info">
            <h2>{item.title}</h2>

            <p>{`${item.price} DH`}</p>

            {order && setOrder && (
              <Functiona order={order} item={item} setOrder={setOrder} />
            )}
          </div>
        </div>

        <div className="description">
          <p>{item.description}</p>
        </div>
      </div>

      <span
        className={`nextprev-btn nextprev-btn-${pageDir}`}
        onClick={() => handleNext(pageNumber, pageDir)}
      >
        <i className={`bx bx-chevron-${dir}`}></i>
      </span>
    </div>
  ) : (
    <div className={`page-${pageDir} page`}>
      <span
        className={`nextprev-btn nextprev-btn-${pageDir}`}
        onClick={() => handleNext(pageNumber, pageDir)}
      >
        <i className={`bx bx-chevron-${dir}`}></i>
      </span>
    </div>
  );
}
