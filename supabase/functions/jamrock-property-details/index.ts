// RentCast integration intentionally retired. View House now provides
// Zillow, Redfin and Google Maps links without paid API requests.
// This endpoint remains as a harmless response for stale clients.
Deno.serve(() => new Response(JSON.stringify({
  ok:false,
  retired:true,
  message:"Property API lookup has been retired. Use View House for Zillow, Redfin and Google Maps."
}),{
  status:410,
  headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
}));
