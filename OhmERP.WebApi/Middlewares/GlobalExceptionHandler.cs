using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Domain.Exceptions; // BusinessException'ı tanımak için

namespace OhmERP.WebApi.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {

        if (exception is BusinessException businessException)
        {


            var businessProblem = new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "İşlem Hatası",
                Detail = businessException.Message, // Kendi mesajımızı yolluyoruz
                Type = "BusinessRuleViolation"
            };
            businessProblem.Extensions.Add("message", businessException.Message);

            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            await httpContext.Response.WriteAsJsonAsync(businessProblem, cancellationToken);
            return true;
        }


        Console.WriteLine($"[SİSTEM HATASI YAKALANDI]: {exception.Message}\n{exception.StackTrace}");

        var serverProblem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Sunucu tarafında beklenmeyen bir hata oluştu.",
            Detail = "İşleminiz şu anda gerçekleştirilemiyor. Lütfen BT departmanı ile iletişime geçin.",
            Type = "InternalServerError"
        };

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(serverProblem, cancellationToken);

        return true;
    }
}